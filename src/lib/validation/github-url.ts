import { z } from 'zod';
import { GITHUB_CONFIG } from '@/config/constants';

const GITHUB_URL_REGEX = /^https?:\/\/github\.com\/([a-zA-Z0-9\-_.]+)\/([a-zA-Z0-9\-_.]+)\/?$/;

export const githubUrlSchema = z.string()
  .url('Please enter a valid URL')
  .regex(GITHUB_URL_REGEX, 'Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return (GITHUB_CONFIG.allowedHosts as readonly string[]).includes(parsed.hostname);
    } catch {
      return false;
    }
  }, 'Only GitHub repository URLs are allowed');

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.trim().match(GITHUB_URL_REGEX);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

export const analyzeRequestSchema = z.object({
  url: githubUrlSchema,
});

export const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  conversation_id: z.string().uuid().optional(),
});

export const locateRequestSchema = z.object({
  query: z.string().min(1, 'Query is required').max(500, 'Query too long'),
});
