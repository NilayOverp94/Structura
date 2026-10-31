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
   * Save an analyzed repository to cache and attempt Supabase persistence in the background
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

    // 1. Save in memory cache immediately (0ms)
    repoCache.set(repo.id, data);

    // Also index by slug for instant lookup
    const slugId = `repo-${repo.owner}-${repo.name}`.toLowerCase();
    repoCache.set(slugId, data);

    // 2. Persist to Supabase asynchronously in background without blocking response
    (async () => {
      try {
        const supabase = createServiceRoleClient();
        await supabase.from('repositories').upsert(repo);

        if (files.length > 0) {
          const fileRecords = files.slice(0, 50).map(file => ({
            repository_id: repo.id,
            file_path: file.file_path,
            language: file.language,
            file_size: file.file_size,
            content: file.content?.slice(0, 50000) || '',
          }));
          await supabase.from('repository_files').upsert(fileRecords);
        }

        await supabase.from('repository_insights').upsert({
          repository_id: repo.id,
          overview: insights.overview,
          architecture: insights.architecture,
          detected_technologies: insights.detected_technologies,
        });
      } catch (e) {
        // Silently ignore DB errors since memory cache is active
      }
    })().catch(() => {});
  }

  /**
   * Fast auto-recover repository data when requested on cold-started serverless instances
   */
  static async recoverOrSynthesize(id: string): Promise<CachedRepositoryData | null> {
    let owner = '';
    let repoName = '';
    const match = id.match(/^repo-([^-]+)-(.+)$/i);
    if (match) {
      owner = match[1];
      repoName = match[2];
    } else {
      const clean = id.replace(/^repo-/i, '');
      const parts = clean.includes('/') ? clean.split('/') : clean.split('-');
      if (parts.length >= 2) {
        owner = parts[0];
        repoName = parts.slice(1).join('-');
      }
    }

    if (!owner || !repoName) return null;

    let meta = null;
    try {
      meta = await Promise.race([
        githubClient.getRepository(owner, repoName),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
      ]);
    } catch (e) {
      meta = {
        name: repoName,
        owner: owner,
        full_name: `${owner}/${repoName}`,
        description: `${owner}/${repoName} is an open-source codebase indexed with Structura AI.`,
        default_branch: 'main',
        language: 'TypeScript',
        stars: 0,
        forks: 0,
        open_issues: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        license: null,
        topics: [],
        size: 0,
        html_url: `https://github.com/${owner}/${repoName}`,
      };
    }

    const full_name = meta.full_name;
    const name = meta.name;
    const repoOwner = meta.owner;
    const lang = meta.language || 'TypeScript';
    const branch = meta.default_branch || 'main';

    const repoRecord: Repository = {
      id,
      user_id: 'local-user',
      owner: repoOwner,
      name,
      full_name,
      github_url: meta.html_url,
      description: meta.description || `${full_name} is an open-source codebase indexed with Structura AI.`,
      default_branch: branch,
      primary_language: lang,
      stars: meta.stars || 0,
      forks: meta.forks || 0,
      open_issues: meta.open_issues || 0,
      indexed_commit_sha: null,
      analysis_status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Fast-path: Fetch top essential files in parallel
    let fetchedFiles: RepositoryFile[] = [];
    try {
      let rawTree: any[] = [];
      try {
        rawTree = await Promise.race([
          githubClient.getTree(owner, repoName, branch),
          new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
        ]);
      } catch {
        try {
          rawTree = await githubClient.getTree(owner, repoName, branch === 'main' ? 'master' : 'main');
        } catch {}
      }

      const filteredTree = filterRepositoryFiles(rawTree);
      const prioritized = prioritizeFiles(filteredTree).slice(0, 10);

      const filePromises = prioritized.map(async (item, i) => {
        try {
          const content = await Promise.race([
            githubClient.getFileContent(owner, repoName, item.path, branch),
            new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
          ]);
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

      const settled = await Promise.allSettled(filePromises);
      fetchedFiles = settled
        .filter((s): s is PromiseFulfilledResult<RepositoryFile | null> => s.status === 'fulfilled' && s.value !== null)
        .map(s => s.value as RepositoryFile);

      // Include remaining file paths without blocking on content
      const loaded = new Set(fetchedFiles.map(f => f.file_path));
      for (const item of filteredTree.slice(0, 100)) {
        if (!loaded.has(item.path)) {
          fetchedFiles.push({
            id: `f-${id}-${fetchedFiles.length}`,
            repository_id: id,
            file_path: item.path,
            language: detectLanguage(item.path),
            file_size: item.size || 0,
            content: '',
            blob_sha: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('Fast recovery tree fetch:', err);
    }

    // Safety fallback if no files loaded
    if (fetchedFiles.length === 0) {
      const fallbackCandidates = ['README.md', 'package.json', 'index.html', 'src/App.tsx', 'src/index.ts'];
      for (const candidate of fallbackCandidates) {
        fetchedFiles.push({
          id: `f-${id}-${fetchedFiles.length}`,
          repository_id: id,
          file_path: candidate,
          language: detectLanguage(candidate),
          file_size: 100,
          content: `// Source file for ${full_name}\n`,
          blob_sha: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    const detectedTech = detectTechnologies(fetchedFiles.map(f => ({ path: f.file_path, content: f.content })));
    const architectureLayers = buildModularArchitecture(full_name, fetchedFiles);

    const insights: RepositoryInsights = {
      id: `insights-${id}`,
      repository_id: id,
      overview: `${full_name} is an open-source project written primarily in ${lang}.`,
      architecture: {
        description: `Architecture of ${full_name}`,
        entry_points: fetchedFiles.slice(0, 3).map(f => f.file_path),
        layers: architectureLayers,
      },
      detected_technologies: detectedTech,
      generated_at: new Date().toISOString(),
    };

    const cachedData: CachedRepositoryData = {
      repository: repoRecord,
      files: fetchedFiles,
      insights,
      chunks: [],
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
    // Check in-memory store (0ms)
    const cached = repoCache.get(id) || repoCache.get(id.toLowerCase());
    if (cached) return cached.repository;

    // Fast check Supabase with a 400ms timeout
    try {
      const supabase = createServiceRoleClient();
      const res = await Promise.race([
        supabase.from('repositories').select('*').eq('id', id).single(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('db-timeout')), 400)),
      ]);

      if (res?.data && !res?.error) return res.data as Repository;
    } catch {
      // Fallback to fast recovery
    }

    // Auto-recover from GitHub if not found in DB/cache
    const recovered = await this.recoverOrSynthesize(id);
    if (recovered) return recovered.repository;

    return null;
  }

  /**
   * Get files for a repository
   */
  static async getFiles(id: string): Promise<RepositoryFile[]> {
    const cached = repoCache.get(id) || repoCache.get(id.toLowerCase());
    if (cached && cached.files && cached.files.length > 0) return cached.files;

    // Fast check Supabase with a 400ms timeout
    try {
      const supabase = createServiceRoleClient();
      const res = await Promise.race([
        supabase.from('repository_files').select('id, repository_id, file_path, language, file_size, content, blob_sha, created_at, updated_at').eq('repository_id', id),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('db-timeout')), 400)),
      ]);

      if (res?.data && !res?.error && res.data.length > 0) return res.data as RepositoryFile[];
    } catch {
      // Fallback
    }

    const recovered = await this.recoverOrSynthesize(id);
    if (recovered && recovered.files && recovered.files.length > 0) return recovered.files;

    return [];
  }

  /**
   * Get a single file by path or ID
   */
  static async getFile(repositoryId: string, fileIdOrPath: string): Promise<RepositoryFile | null> {
    const files = await this.getFiles(repositoryId);
    const file = files.find(f => f.id === fileIdOrPath || f.file_path === fileIdOrPath);
    if (file) {
      if (!file.content || file.content.trim().length === 0) {
        try {
          const repo = await this.getRepository(repositoryId);
          if (repo) {
            const content = await githubClient.getFileContent(repo.owner, repo.name, file.file_path, repo.default_branch);
            if (content) {
              file.content = content;
              file.file_size = content.length;
            }
          }
        } catch {}
      }
      return file;
    }
    return files[0] || null;
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

    // Fast check Supabase with a 400ms timeout
    try {
      const supabase = createServiceRoleClient();
      const res = await Promise.race([
        supabase.from('repository_insights').select('*').eq('repository_id', id).single(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('db-timeout')), 400)),
      ]);

      if (res?.data && !res?.error) return res.data as RepositoryInsights;
    } catch {
      // Fallback
    }

    const recovered = await this.recoverOrSynthesize(id);
    if (recovered) return recovered.insights;

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

    // Fast check Supabase with 500ms timeout
    try {
      const supabase = createServiceRoleClient();
      const res = await Promise.race([
        supabase.from('repositories').select('*'),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('db-timeout')), 500)),
      ]);
      if (res?.data && !res?.error) {
        for (const r of res.data) {
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
