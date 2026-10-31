'use client';

import { Repository, RepositoryFile, RepositoryInsights, DependencyInfo } from '@/types';

export interface WorkspaceCacheEntry {
  repository?: Repository;
  insights?: RepositoryInsights;
  files?: RepositoryFile[];
  dependencies?: DependencyInfo[];
  updatedAt: number;
}

const memoryCache = new Map<string, WorkspaceCacheEntry>();
const REPO_LIST_KEY = 'structura_cached_repositories_v2';
const WORKSPACE_PREFIX = 'structura_ws_cache_';
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

/**
 * Get cached workspace data instantly from memory or localStorage
 */
export function getWorkspaceCache(repoId: string): WorkspaceCacheEntry | null {
  if (!repoId) return null;
  const key = repoId.toLowerCase();

  // 1. Check in-memory Map (0ms)
  const inMemory = memoryCache.get(key);
  if (inMemory && Date.now() - inMemory.updatedAt < CACHE_TTL_MS) {
    return inMemory;
  }

  // 2. Check localStorage (1ms)
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${WORKSPACE_PREFIX}${key}`);
      if (raw) {
        const parsed: WorkspaceCacheEntry = JSON.parse(raw);
        if (parsed && Date.now() - parsed.updatedAt < CACHE_TTL_MS) {
          memoryCache.set(key, parsed);
          return parsed;
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  return inMemory || null;
}

/**
 * Update cached workspace data in memory and localStorage
 */
export function setWorkspaceCache(repoId: string, partial: Partial<WorkspaceCacheEntry>): void {
  if (!repoId) return;
  const key = repoId.toLowerCase();

  const existing = memoryCache.get(key) || { updatedAt: Date.now() };
  const updated: WorkspaceCacheEntry = {
    ...existing,
    ...partial,
    updatedAt: Date.now(),
  };

  memoryCache.set(key, updated);

  if (typeof window !== 'undefined') {
    try {
      // Do not store massive full-text file blobs in localStorage to avoid quota limits
      const storageSafe = {
        ...updated,
        files: updated.files ? updated.files.slice(0, 50).map(f => ({
          ...f,
          content: f.content && f.content.length > 2000 ? f.content.slice(0, 2000) : f.content,
        })) : undefined,
      };
      localStorage.setItem(`${WORKSPACE_PREFIX}${key}`, JSON.stringify(storageSafe));
    } catch (e) {
      // Quota exceeded or private browsing
      console.warn('LocalStorage workspace cache limit reached, using in-memory cache:', e);
    }
  }
}

/**
 * Get cached repository list for the dashboard
 */
export function getCachedRepoList(): Repository[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REPO_LIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

/**
 * Save repository list to localStorage
 */
export function setCachedRepoList(repos: Repository[]): void {
  if (typeof window === 'undefined' || !Array.isArray(repos)) return;
  try {
    localStorage.setItem(REPO_LIST_KEY, JSON.stringify(repos.slice(0, 25)));
  } catch {}
}
