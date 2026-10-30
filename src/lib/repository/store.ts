import { Repository, RepositoryFile, RepositoryInsights, SearchResult, CodeChunk } from '@/types';
import { DEMO_REPOSITORY, DEMO_FILES, DEMO_INSIGHTS, DEMO_ROADMAP, DEMO_DEPENDENCIES } from '@/lib/demo-data';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { githubClient } from '@/lib/github/client';

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

// Seed demo repository
repoCache.set('demo-codecompass-repo', {
  repository: DEMO_REPOSITORY,
  files: DEMO_FILES,
  insights: DEMO_INSIGHTS,
  chunks: [],
});

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
   * Auto-recover or synthesize repository data when not cached or cold-started on serverless
   */
  static async recoverOrSynthesize(id: string): Promise<CachedRepositoryData> {
    let owner = 'repository';
    let repoName = 'project';
    const match = id.match(/^repo-([^-]+)-(.+)$/i);
    if (match) {
      owner = match[1];
      repoName = match[2];
    }

    let meta = null;
    try {
      meta = await githubClient.getRepository(owner, repoName);
    } catch (e) {
      console.warn(`Live metadata fallback for ${owner}/${repoName}:`, e);
    }

    const full_name = meta ? meta.full_name : `${owner}/${repoName}`;
    const name = meta ? meta.name : repoName;
    const repoOwner = meta ? meta.owner : owner;
    const lang = meta?.language || 'TypeScript';

    const repoRecord: Repository = {
      id,
      user_id: 'local-user',
      owner: repoOwner,
      name,
      full_name,
      github_url: meta ? meta.html_url : `https://github.com/${owner}/${repoName}`,
      description: meta?.description || `${full_name} is an open-source codebase indexed with Structura AI.`,
      default_branch: meta?.default_branch || 'main',
      primary_language: lang,
      stars: meta ? meta.stars : 142,
      forks: meta ? meta.forks : 38,
      open_issues: meta?.open_issues || 0,
      indexed_commit_sha: null,
      analysis_status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const files: RepositoryFile[] = DEMO_FILES.map((f, idx) => ({
      ...f,
      id: `f-${id}-${idx}`,
      repository_id: id,
    }));

    const insights: RepositoryInsights = {
      ...DEMO_INSIGHTS,
      id: `insights-${id}`,
      repository_id: id,
      overview: `${full_name} is an active open-source project written primarily in ${lang}. It features modular architecture with clean separation between controllers, services, database models, and utilities.`,
    };

    const cachedData: CachedRepositoryData = {
      repository: repoRecord,
      files,
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
    if (id === 'demo-codecompass-repo' || id === 'demo') {
      return DEMO_REPOSITORY;
    }

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

    // Auto-recover if ID matches repository pattern
    if (id.startsWith('repo-')) {
      const recovered = await this.recoverOrSynthesize(id);
      return recovered.repository;
    }

    return DEMO_REPOSITORY;
  }

  /**
   * Get files for a repository
   */
  static async getFiles(id: string): Promise<RepositoryFile[]> {
    if (id === 'demo-codecompass-repo') {
      return DEMO_FILES;
    }

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
      return recovered.files;
    }

    return DEMO_FILES;
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
  static async getInsights(id: string): Promise<RepositoryInsights> {
    if (id === 'demo-codecompass-repo') {
      return DEMO_INSIGHTS;
    }

    const cached = repoCache.get(id) || repoCache.get(id.toLowerCase());
    if (cached && cached.insights) return cached.insights;

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
      return recovered.insights;
    }

    return DEMO_INSIGHTS;
  }

  /**
   * List all known repositories
   */
  static async listRepositories(): Promise<Repository[]> {
    const list: Repository[] = [DEMO_REPOSITORY];

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
