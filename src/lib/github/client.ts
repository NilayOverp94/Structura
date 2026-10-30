import { GITHUB_CONFIG } from '@/config/constants';
import { GitHubRepoMeta, GitHubTreeItem } from '@/types';

class GitHubClient {
  private token: string | undefined;
  private baseUrl: string;

  constructor() {
    this.token = process.env.GITHUB_TOKEN;
    this.baseUrl = GITHUB_CONFIG.apiBase;
  }

  private async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Structura-AI',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 403) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        const resetTime = response.headers.get('x-ratelimit-reset');
        throw new Error(
          `GitHub API rate limit exceeded. ${resetTime ? `Resets at ${new Date(parseInt(resetTime) * 1000).toISOString()}` : 'Please try again later or configure GITHUB_TOKEN.'}`
        );
      }
    }

    if (response.status === 404) {
      throw new Error('Repository not found. Please verify the URL and confirm the repository is public.');
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}${body ? ` - ${body}` : ''}`);
    }

    return response;
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepoMeta> {
    const response = await this.fetch(`/repos/${owner}/${repo}`);
    const data = await response.json();

    return {
      name: data.name,
      owner: data.owner.login,
      full_name: data.full_name,
      description: data.description,
      default_branch: data.default_branch || 'main',
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
      open_issues: data.open_issues_count,
      created_at: data.created_at,
      updated_at: data.updated_at,
      license: data.license?.spdx_id || null,
      topics: data.topics || [],
      size: data.size,
      html_url: data.html_url,
    };
  }

  async getTree(owner: string, repo: string, branch: string): Promise<GitHubTreeItem[]> {
    const response = await this.fetch(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
    const data = await response.json();

    if (data.truncated) {
      console.warn('Repository tree was truncated by GitHub API. Some files may not be indexed.');
    }

    return (data.tree || []).filter((item: GitHubTreeItem) => item.type === 'blob');
  }

  async getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<string> {
    const query = ref ? `?ref=${encodeURIComponent(ref)}` : '';
    const response = await this.fetch(`/repos/${owner}/${repo}/contents/${path}${query}`, {
      headers: { 'Accept': 'application/vnd.github.v3.raw' },
    });
    return response.text();
  }

  async getLatestCommitSha(owner: string, repo: string, branch: string): Promise<string> {
    const response = await this.fetch(`/repos/${owner}/${repo}/commits/${branch}`);
    const data = await response.json();
    return data.sha;
  }

  async getRateLimit(): Promise<{ remaining: number; limit: number; reset: Date }> {
    const response = await this.fetch('/rate_limit');
    const data = await response.json();
    return {
      remaining: data.rate.remaining,
      limit: data.rate.limit,
      reset: new Date(data.rate.reset * 1000),
    };
  }
}

export const githubClient = new GitHubClient();

