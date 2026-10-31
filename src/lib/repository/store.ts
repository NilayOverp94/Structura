import { Repository, RepositoryFile, RepositoryInsights, CodeChunk } from '@/types';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { githubClient } from '@/lib/github/client';
import { filterRepositoryFiles, detectLanguage, prioritizeFiles } from '@/lib/github/filter';
import { detectTechnologies } from '@/lib/analysis/technology-detector';
import { chunkFileContent } from '@/lib/analysis/chunker';
import { generateJSON, hasGeminiKey } from '@/lib/gemini/client';
import { ARCHITECTURE_PROMPT } from '@/lib/rag/prompts';
import { buildModularArchitecture } from '@/lib/analysis/architecture-synthesizer';

interface CachedRepositoryData {
  repository: Repository;
  files: RepositoryFile[];
  insights: RepositoryInsights;
  chunks: CodeChunk[];
}

// Global in-memory cache preserved across module reloads
const globalCache = globalThis as unknown as {
  __STRUCTURA_REPO_CACHE__?: Map<string, CachedRepositoryData>;
};

if (!globalCache.__STRUCTURA_REPO_CACHE__) {
  globalCache.__STRUCTURA_REPO_CACHE__ = new Map();
}

const repoCache = globalCache.__STRUCTURA_REPO_CACHE__;

export class RepositoryStore {
  /**
   * Save an analyzed repository to cache and attempt Supabase persistence
   */
  static async saveRepository(
    repo: Repository,
    files: RepositoryFile[],
    insights: RepositoryInsights,
    chunks: CodeChunk[] = []
  ): Promise<void> {
    const data: CachedRepositoryData = {
      repository: repo,
      files,
      insights,
      chunks,
    };

    // 1. Save in memory cache immediately
    repoCache.set(repo.id, data);

    // Also index by slug for quick lookup
    const slugId = `repo-${repo.owner}-${repo.name}`.toLowerCase();
    repoCache.set(slugId, data);

    // 2. Persist to Supabase if available
    try {
      const supabase = createServiceRoleClient();
      await supabase.from('repositories').upsert(repo);

      for (const file of files) {
        await supabase.from('repository_files').upsert({
          repository_id: repo.id,
          file_path: file.file_path,
          language: file.language,
          file_size: file.file_size,
          content: file.content,
        });
      }

      await supabase.from('repository_insights').upsert({
        repository_id: repo.id,
        overview: insights.overview,
        architecture: insights.architecture,
        detected_technologies: insights.detected_technologies,
      });
    } catch (e) {
      console.warn('Supabase DB persistence skipped or error (running in local runtime state):', e);
    }
  }

  /**
   * Auto-recover repository data when requested on cold-started serverless instances
   */
  static async recoverOrSynthesize(id: string): Promise<CachedRepositoryData | null> {
    let owner = '';
    let repoName = '';
    const match = id.match(/^repo-([^-]+)-(.+)$/i);
    if (!match) return null;

    owner = match[1];
    repoName = match[2];

    let meta = null;
    try {
      meta = await githubClient.getRepository(owner, repoName);
    } catch (e) {
      console.warn(`Could not resolve GitHub repository ${owner}/${repoName}:`, e);
      return null;
    }

    const full_name = meta.full_name;
    const name = meta.name;
    const repoOwner = meta.owner;
    const lang = meta.language || 'TypeScript';

    const repoRecord: Repository = {
      id,
      user_id: 'local-user',
      owner: repoOwner,
      name,
      full_name,
      github_url: meta.html_url,
      description: meta.description || `${full_name} is an open-source codebase indexed with Structura AI.`,
      default_branch: meta.default_branch || 'main',
      primary_language: lang,
      stars: meta.stars,
      forks: meta.forks,
      open_issues: meta.open_issues || 0,
      indexed_commit_sha: null,
      analysis_status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Fetch repository files from GitHub in high-speed parallel batches
    let fetchedFiles: RepositoryFile[] = [];
    try {
      const rawTree = await githubClient.getTree(owner, repoName, meta.default_branch);
      const filteredTree = filterRepositoryFiles(rawTree);
      const prioritized = prioritizeFiles(filteredTree).slice(0, 30);

      const filePromises = prioritized.map(async (item, i) => {
        try {
          const content = await githubClient.getFileContent(owner, repoName, item.path, meta.default_branch);
          return {
            id: `f-${id}-${i}`,
            repository_id: id,
            file_path: item.path,
            language: detectLanguage(item.path),
            file_size: item.size || content.length,
            content,
            blob_sha: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as RepositoryFile;
        } catch {
          return null;
        }
      });

      const settled = await Promise.all(filePromises);
      fetchedFiles = settled.filter((f): f is RepositoryFile => f !== null);
    } catch (err) {
      console.warn('Live tree fetch error in recovery:', err);
    }

    const detectedTech = detectTechnologies(fetchedFiles.map(f => ({ path: f.file_path, content: f.content })));

    let overview = `${full_name} is an open-source project written primarily in ${lang}.`;
    let architectureLayers = buildModularArchitecture(full_name, fetchedFiles);

    if (hasGeminiKey() && fetchedFiles.length > 0) {
      try {
        const summaryFiles = fetchedFiles.slice(0, 10).map(f => `File: ${f.file_path}\n${f.content.slice(0, 400)}`).join('\n\n');
        const prompt = `Repository: ${full_name}\nDescription: ${meta.description || ''}\n\nFiles:\n${summaryFiles}`;
        const aiInsights = await generateJSON<any>(prompt, ARCHITECTURE_PROMPT);
        if (aiInsights?.architecture?.layers && Array.isArray(aiInsights.architecture.layers) && aiInsights.architecture.layers.length >= 2) {
          architectureLayers = aiInsights.architecture.layers;
        }
        if (aiInsights?.overview) {
          overview = aiInsights.overview;
        }
      } catch (e) {
        console.warn('Gemini architecture recovery fallback:', e);
      }
    }

    const insights: RepositoryInsights = {
      id: `insights-${id}`,
      repository_id: id,
      overview,
      architecture: {
        description: `Architecture of ${full_name}`,
        entry_points: fetchedFiles.slice(0, 3).map(f => f.file_path),
        layers: architectureLayers,
      },
      detected_technologies: detectedTech,
      generated_at: new Date().toISOString(),
    };

    const chunks: CodeChunk[] = [];
    fetchedFiles.forEach((file, fIdx) => {
      const c = chunkFileContent(file.content, file.file_path, file.language);
      c.forEach((chunk, cIdx) => {
        chunks.push({
          id: `chunk-${file.id}-${cIdx}`,
          repository_id: id,
          file_id: file.id,
          chunk_index: cIdx,
          content: chunk.content,
          start_line: chunk.startLine,
          end_line: chunk.endLine,
          embedding: null,
          metadata: { file_path: file.file_path, language: file.language },
          created_at: new Date().toISOString(),
        });
      });
    });

    const cachedData: CachedRepositoryData = {
      repository: repoRecord,
      files: fetchedFiles,
      insights,
      chunks,
    };

    repoCache.set(id, cachedData);
    const slug = `repo-${owner}-${name}`.toLowerCase();
    repoCache.set(slug, cachedData);

    return cachedData;
  }

  /**
   * Get repository metadata by ID
   */
  static async getRepository(id: string): Promise<Repository | null> {
    // Check in-memory store
    const cached = repoCache.get(id) || repoCache.get(id.toLowerCase());
    if (cached) return cached.repository;

    // Check Supabase
    try {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .eq('id', id)
        .single();

      if (data && !error) return data as Repository;
    } catch {
      // Fallback
    }

    // Auto-recover from GitHub if ID matches repository pattern
    if (id.startsWith('repo-')) {
      const recovered = await this.recoverOrSynthesize(id);
      if (recovered) return recovered.repository;
    }

    return null;
  }

  /**
   * Get files for a repository
   */
  static async getFiles(id: string): Promise<RepositoryFile[]> {
    const cached = repoCache.get(id) || repoCache.get(id.toLowerCase());
    if (cached && cached.files && cached.files.length > 0) return cached.files;

    // Check Supabase
    try {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from('repository_files')
        .select('id, repository_id, file_path, language, file_size, content, blob_sha, created_at, updated_at')
        .eq('repository_id', id);

      if (data && !error && data.length > 0) return data as RepositoryFile[];
    } catch {
      // Fallback
    }

    if (id.startsWith('repo-')) {
      const recovered = await this.recoverOrSynthesize(id);
      if (recovered) return recovered.files;
    }

    return [];
  }

  /**
   * Get a single file by path or ID
   */
  static async getFile(repositoryId: string, fileIdOrPath: string): Promise<RepositoryFile | null> {
    const files = await this.getFiles(repositoryId);
    return files.find(f => f.id === fileIdOrPath || f.file_path === fileIdOrPath) || files[0] || null;
  }

  /**
   * Get insights and architecture for a repository
   */
  static async getInsights(id: string): Promise<RepositoryInsights | null> {
    const cached = repoCache.get(id) || repoCache.get(id.toLowerCase());
    if (cached && cached.insights) {
      // If cached insights has <= 1 layer, auto-upgrade with multi-layer topology
      if (
        !cached.insights.architecture?.layers ||
        cached.insights.architecture.layers.length <= 1
      ) {
        cached.insights.architecture.layers = buildModularArchitecture(
          cached.repository?.full_name || id,
          cached.files || []
        );
      }
      return cached.insights;
    }

    // Check Supabase
    try {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from('repository_insights')
        .select('*')
        .eq('repository_id', id)
        .single();

      if (data && !error) return data as RepositoryInsights;
    } catch {
      // Fallback
    }

    if (id.startsWith('repo-')) {
      const recovered = await this.recoverOrSynthesize(id);
      if (recovered) return recovered.insights;
    }

    return null;
  }

  /**
   * List all known repositories
   */
  static async listRepositories(): Promise<Repository[]> {
    const list: Repository[] = [];

    // From memory
    for (const [_, data] of repoCache.entries()) {
      if (data.repository && !list.some(r => r.id === data.repository.id)) {
        list.push(data.repository);
      }
    }

    // From Supabase
    try {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase.from('repositories').select('*');
      if (data && !error) {
        for (const r of data) {
          if (!list.some(existing => existing.id === r.id)) {
            list.push(r as Repository);
          }
        }
      }
    } catch {
      // Ignore
    }

    return list;
  }
}
