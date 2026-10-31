import { z } from 'zod';
import { GITHUB_CONFIG } from '@/config/constants';

// Regex supports standard URLs, .git suffixes, and /tree/branch formats
const GITHUB_URL_REGEX = /^https?:\/\/github\.com\/([a-zA-Z0-9\-_.]+)\/([a-zA-Z0-9\-_.]+?)(?:\.git)?(?:\/tree\/([a-zA-Z0-9\-_./]+))?\/?$/;

export const githubUrlSchema = z.string()
  .url('Please enter a valid URL')
  .regex(GITHUB_URL_REGEX, 'Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo or https://github.com/owner/repo/tree/main)')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return (GITHUB_CONFIG.allowedHosts as readonly string[]).includes(parsed.hostname);
    } catch {
      return false;
    }
  }, 'Only GitHub repository URLs are allowed');

export function parseGitHubUrl(url: string): { owner: string; repo: string; branch?: string } | null {
  const match = url.trim().match(GITHUB_URL_REGEX);
  if (!match) return null;
  const owner = match[1];
  let repo = match[2];
  if (repo.endsWith('.git')) {
    repo = repo.slice(0, -4);
  }
  const branch = match[3] || undefined;
  return { owner, repo, branch };
}

export const analyzeRequestSchema = z.object({
  url: githubUrlSchema,
  branch: z.string().optional(),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  conversation_id: z.string().optional(),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).optional(),
});

export const locateRequestSchema = z.object({
  query: z.string().min(1, 'Query is required').max(500, 'Query too long'),
});
