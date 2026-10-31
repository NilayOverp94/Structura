'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  GitBranch, 
  Search, 
  Star, 
  ExternalLink, 
  ArrowRight,
  FolderGit2,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { notionEase } from '@/lib/animations/motion';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { parseGitHubUrl } from '@/lib/validation/github-url';
import { Repository } from '@/types';
import { getCachedRepoList, setCachedRepoList } from '@/lib/cache/workspace-cache';

export default function DashboardPage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState('');
  const [repositories, setRepositories] = useState<Repository[]>(() => getCachedRepoList());
  const [loading, setLoading] = useState(() => getCachedRepoList().length === 0);

  useEffect(() => {
    fetch('/api/repositories')
      .then((res) => res.json())
      .then((data) => {
        if (data.repositories && Array.isArray(data.repositories)) {
          setRepositories(data.repositories);
          setCachedRepoList(data.repositories);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    const parsed = parseGitHubUrl(repoUrl.trim());
    if (!parsed) {
      setError('Enter a valid URL (e.g. https://github.com/owner/repo)');
      return;
    }

    router.push(`/analyze?url=${encodeURIComponent(repoUrl.trim())}`);
  };

  const totalStars = repositories.reduce((acc, r) => acc + (r.stars || 0), 0);
  const detectedLanguages = Array.from(new Set(repositories.map(r => r.primary_language).filter(Boolean)));

  return (
    <div className="min-h-screen bg-surface-primary">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: notionEase }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border"
        >
          <div>
            <h1 className="text-2xl font-bold text-txt-primary tracking-tight">Developer Workspace</h1>
            <p className="text-sm text-txt-secondary mt-1">
              Select an analyzed codebase to inspect its architecture, or submit a new GitHub repository.
            </p>
          </div>
        </motion.div>

        {/* Repository Submission Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06, ease: notionEase }}
          className="card space-y-4"
        >
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-5 w-5 text-txt-primary" />
            <h2 className="text-base font-semibold text-txt-primary">Analyze New GitHub Repository</h2>
          </div>
          <form onSubmit={handleAnalyze} className="relative">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <GitBranch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-muted" />
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => { setRepoUrl(e.target.value); setError(''); }}
                  placeholder="https://github.com/facebook/react"
                  className="input-field pl-10 font-mono text-sm"
                />
              </div>
              <Button type="submit" variant="primary" className="flex-shrink-0">
                <Search className="h-4 w-4" />
                Analyze
              </Button>
            </div>
            {error && (
              <p className="text-xs text-status-error mt-2">{error}</p>
            )}
          </form>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.06, delayChildren: 0.1 },
            },
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            className="card p-4 transition-colors hover:bg-surface-secondary/70"
          >
            <p className="section-label">Total Repositories</p>
            <p className="text-2xl font-bold text-txt-primary mt-1 font-mono">{repositories.length}</p>
            <p className="text-xs text-txt-secondary mt-1">Active in your workspace</p>
          </motion.div>
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            className="card p-4 transition-colors hover:bg-surface-secondary/70"
          >
            <p className="section-label">Combined GitHub Stars</p>
            <p className="text-2xl font-bold text-txt-primary mt-1 font-mono">{totalStars.toLocaleString()}</p>
            <p className="text-xs text-txt-secondary mt-1">Across analyzed codebases</p>
          </motion.div>
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            className="card p-4 transition-colors hover:bg-surface-secondary/70"
          >
            <p className="section-label">Languages Detected</p>
            <p className="text-2xl font-bold text-txt-primary mt-1 font-mono">{detectedLanguages.length || 0}</p>
            <p className="text-xs text-txt-secondary mt-1">
              {detectedLanguages.slice(0, 3).join(', ') || 'Ready for ingestion'}
            </p>
          </motion.div>
        </motion.div>

        {/* Analyzed Repositories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-txt-primary">Analyzed Repositories</h2>
            <span className="text-xs text-txt-muted font-mono">{repositories.length} total</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="card p-5 space-y-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 bg-surface-tertiary rounded" />
                      <div className="h-3 w-20 bg-surface-tertiary/60 rounded" />
                    </div>
                    <div className="h-5 w-16 bg-surface-tertiary rounded-full" />
                  </div>
                  <div className="h-8 bg-surface-tertiary/40 rounded" />
                  <div className="h-4 w-full bg-surface-tertiary/30 rounded" />
                </div>
              ))}
            </div>
          ) : repositories.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="card text-center py-14 space-y-3"
            >
              <FolderGit2 className="h-10 w-10 text-txt-muted mx-auto" />
              <h3 className="text-sm font-semibold text-txt-primary">No repositories analyzed yet</h3>
              <p className="text-xs text-txt-secondary max-w-sm mx-auto">
                Paste any public GitHub repository URL into the field above to index its architecture, dependencies, and files.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.07, delayChildren: 0.15 },
                },
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {repositories.map((repo) => (
                <motion.div
                  key={repo.id}
                  variants={{
                    hidden: { opacity: 0, y: 14 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: notionEase } },
                  }}
                  whileHover={{ y: -4, scale: 1.008, transition: { duration: 0.18, ease: notionEase } }}
                  className="card-hover flex flex-col justify-between p-5 space-y-4 shadow-sm hover:shadow-xl hover:shadow-black/20 hover:border-zinc-500 transition-all duration-200"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/workspace/${repo.id}`}
                            className="text-base font-semibold text-txt-primary hover:underline transition-colors"
                          >
                            {repo.name}
                          </Link>
                          <Badge variant="success" className="inline-flex items-center gap-1.5">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                            </span>
                            Indexed
                          </Badge>
                        </div>
                        <p className="text-xs text-txt-muted font-mono mt-0.5">{repo.owner}</p>
                      </div>
                      <motion.a
                        href={repo.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded-md text-txt-muted hover:text-txt-primary hover:bg-surface-tertiary transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </motion.a>
                    </div>

                    <p className="text-xs text-txt-secondary mt-3 line-clamp-2 leading-relaxed">
                      {repo.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-txt-muted">
                    <div className="flex items-center gap-3 font-mono">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-status-warning" />
                        {repo.stars.toLocaleString()}
                      </span>
                      <span>{repo.primary_language}</span>
                    </div>

                    <Link
                      href={`/workspace/${repo.id}`}
                      className="inline-flex items-center gap-1 text-txt-primary hover:underline font-medium group"
                    >
                      Open Workspace
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
