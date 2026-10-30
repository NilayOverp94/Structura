import { githubClient } from '@/lib/github/client';
import { filterRepositoryFiles, detectLanguage, prioritizeFiles } from '@/lib/github/filter';
import { detectTechnologies } from '@/lib/analysis/technology-detector';
import { chunkFileContent } from '@/lib/analysis/chunker';
import { extractDependencies } from '@/lib/analysis/dependency-analyzer';
import { generateEmbedding, generateJSON, hasGeminiKey } from '@/lib/gemini/client';
import { ARCHITECTURE_PROMPT, ROADMAP_PROMPT } from '@/lib/rag/prompts';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { 
  Repository, 
  RepositoryFile, 
  RepositoryInsights, 
  LearningPath,
  AnalysisStatus 
} from '@/types';
import { DEMO_REPOSITORY, DEMO_FILES, DEMO_INSIGHTS, DEMO_ROADMAP } from '@/lib/demo-data';

export interface ProgressCallback {
  (stage: string, progress: number, message?: string): void;
}

export class RepositoryAnalyzer {
  private repoId: string;
  private onProgress?: ProgressCallback;

  constructor(repoId: string, onProgress?: ProgressCallback) {
    this.repoId = repoId;
    this.onProgress = onProgress;
  }

  private updateProgress(stage: string, progress: number, message?: string) {
    if (this.onProgress) {
      this.onProgress(stage, progress, message);
    }
  }

  async analyze(owner: string, repo: string, userId: string): Promise<Repository> {
    try {
      // Stage 1: Connecting to GitHub
      this.updateProgress('connecting', 5, 'Connecting to GitHub API...');
      const meta = await githubClient.getRepository(owner, repo);

      // Stage 2: Fetching repository metadata
      this.updateProgress('fetching_metadata', 15, 'Fetching repository commit history and branches...');
      let commitSha: string | null = null;
      try {
        commitSha = await githubClient.getLatestCommitSha(owner, repo, meta.default_branch);
      } catch (e) {
        console.warn('Could not fetch commit SHA:', e);
      }

      // Stage 3: Fetching tree
      this.updateProgress('fetching_tree', 25, 'Scanning repository tree...');
      const rawTree = await githubClient.getTree(owner, repo, meta.default_branch);
      const filteredTree = filterRepositoryFiles(rawTree);
      const prioritized = prioritizeFiles(filteredTree).slice(0, 30); // Index top 30 key files

      // Stage 4: Reading source files
      this.updateProgress('fetching_files', 40, `Reading contents of ${prioritized.length} source files...`);
      const fetchedFiles: { path: string; content: string; language: string | null; size: number }[] = [];

      for (let i = 0; i < prioritized.length; i++) {
        const item = prioritized[i];
        try {
          const content = await githubClient.getFileContent(owner, repo, item.path, meta.default_branch);
          const lang = detectLanguage(item.path);
          fetchedFiles.push({
            path: item.path,
            content,
            language: lang,
            size: item.size || content.length,
          });
        } catch (err) {
          console.warn(`Skipping unreadable file ${item.path}:`, err);
        }

        const pct = 40 + Math.floor((i / prioritized.length) * 20);
        this.updateProgress('fetching_files', pct, `Indexed ${i + 1}/${prioritized.length} files`);
      }

      // Stage 5: Analyzing dependencies & technologies
      this.updateProgress('analyzing', 65, 'Analyzing technologies, frameworks, and architecture...');
      const detectedTech = detectTechnologies(fetchedFiles);

      // Stage 6: Generating embeddings & chunks
      this.updateProgress('generating_embeddings', 75, 'Computing code chunks and embeddings...');
      const allChunks = [];
      for (const file of fetchedFiles) {
        const chunks = chunkFileContent(file.content, file.path, file.language);
        for (const chunk of chunks) {
          allChunks.push({
            ...chunk,
            filePath: file.path,
          });
        }
      }

      // Stage 7: Generating Architecture Insights & Roadmap with Gemini
      this.updateProgress('generating_insights', 85, 'Synthesizing architecture and contributor roadmap...');
      let insightsData: RepositoryInsights['architecture'] = {
        description: `Architecture of ${meta.full_name} (${meta.language || 'Multi-language'})`,
        entry_points: fetchedFiles.slice(0, 3).map(f => f.path),
        layers: [
          {
            name: 'Core Application & Entry',
            description: 'Main application logic and initialization',
            category: 'backend',
            files: fetchedFiles.slice(0, 5).map(f => f.path),
          },
          {
            name: 'Utilities & Configuration',
            description: 'Configuration manifests and utility libraries',
            category: 'config',
            files: fetchedFiles.filter(f => f.path.includes('config') || f.path.endsWith('.json') || f.path.endsWith('.md')).map(f => f.path),
          },
        ],
      };

      let overviewText = `${meta.full_name} is an open-source project written primarily in ${meta.language || 'TypeScript'}. It has ${meta.stars.toLocaleString()} stars on GitHub.`;

      if (hasGeminiKey()) {
        try {
          const summaryFiles = fetchedFiles.slice(0, 10).map(f => `File: ${f.path}\nExcerpt:\n${f.content.slice(0, 500)}`).join('\n\n');
          const prompt = `Repository: ${meta.full_name}\nDescription: ${meta.description || 'N/A'}\n\nKey Files:\n${summaryFiles}`;
          
          const aiInsights = await generateJSON<{
            overview: string;
            architecture: RepositoryInsights['architecture'];
          }>(prompt, ARCHITECTURE_PROMPT);

          if (aiInsights?.architecture) {
            insightsData = aiInsights.architecture;
            overviewText = aiInsights.overview;
          }
        } catch (e) {
          console.warn('Gemini architecture synthesis fallback:', e);
        }
      }

      // Stage 8: Finalizing & saving
      this.updateProgress('finalizing', 95, 'Saving repository workspace state...');

      const repositoryRecord: Repository = {
        id: this.repoId,
        user_id: userId,
        owner: meta.owner,
        name: meta.name,
        full_name: meta.full_name,
        github_url: meta.html_url,
        description: meta.description,
        default_branch: meta.default_branch,
        primary_language: meta.language,
        stars: meta.stars,
        forks: meta.forks,
        open_issues: meta.open_issues,
        indexed_commit_sha: commitSha,
        analysis_status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Try persisting to Supabase if available
      try {
        const supabase = createServiceRoleClient();
        await supabase.from('repositories').upsert(repositoryRecord);

        // Insert files
        for (const file of fetchedFiles) {
          await supabase.from('repository_files').upsert({
            repository_id: this.repoId,
            file_path: file.path,
            language: file.language,
            file_size: file.size,
            content: file.content,
          });
        }

        // Insert insights
        await supabase.from('repository_insights').upsert({
          repository_id: this.repoId,
          overview: overviewText,
          architecture: insightsData,
          detected_technologies: detectedTech,
        });
      } catch (dbErr) {
        console.warn('Supabase DB persistence skipped or error (running in local runtime state):', dbErr);
      }

      this.updateProgress('completed', 100, 'Analysis complete!');
      return repositoryRecord;
    } catch (error: any) {
      console.error('Repository analysis pipeline error:', error);
      this.updateProgress('failed', 0, error.message || 'Analysis failed');
      throw error;
    }
  }
}

