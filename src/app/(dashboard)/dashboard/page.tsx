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

export default function DashboardPage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState('');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/repositories')
      .then((res) => res.json())
      .then((data) => {
        if (data.repositories && Array.isArray(data.repositories)) {
          setRepositories(data.repositories);
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

          <div className="flex items-center gap-2">
            <Link href="/compare">
              <Button variant="secondary" size="sm" className="text-xs">
                Compare Repositories
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Demo Repository Experience Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.04, ease: notionEase }}
          className="card p-4 bg-surface-secondary/70 border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-[10px] bg-zinc-800 text-zinc-200 border-zinc-700 font-mono">
                Interactive Demo
              </Badge>
              <span className="text-xs font-semibold text-txt-primary">structura-ai/structura-core</span>
            </div>
            <p className="text-xs text-txt-secondary leading-relaxed">
              Explore Structura&apos;s full RAG codebase chatbot, interactive React Flow architecture explorer, and dependency topology without configuring a GitHub account.
            </p>
          </div>
          <Link href="/workspace/demo-codecompass-repo">
            <Button variant="secondary" size="sm" className="text-xs shrink-0 whitespace-nowrap">
              Launch Demo Workspace →
            </Button>
          </Link>
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
            <div className="card flex items-center justify-center py-12 text-txt-muted text-xs gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading workspaces...
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
                  whileHover={{ y: -3, transition: { duration: 0.18, ease: notionEase } }}
                  className="card-hover flex flex-col justify-between p-5 space-y-4"
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
                          <Badge variant="success">Indexed</Badge>
                        </div>
                        <p className="text-xs text-txt-muted font-mono mt-0.5">{repo.owner}</p>
                      </div>
                      <a
                        href={repo.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded text-txt-muted hover:text-txt-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>

                    <p className="text-xs text-txt-secondary mt-3 line-clamp-2">
                      {repo.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs text-txt-muted">
                    <div className="flex items-center gap-3 font-mono">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-status-warning" />
                        {repo.stars.toLocaleString()}
                      </span>
                      <span>{repo.primary_language}</span>
                      {repo.created_at && (
                        <span className="text-[11px] text-txt-muted hidden sm:inline">
                          Indexed {new Date(repo.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/analyze?url=${encodeURIComponent(repo.github_url)}`}
                        className="text-txt-muted hover:text-txt-primary text-[11px] font-mono transition-colors"
                        title="Re-run analysis to index latest commits"
                      >
                        Re-index
                      </Link>
                      <Link
                        href={`/workspace/${repo.id}`}
                        className="inline-flex items-center gap-1 text-txt-primary hover:underline font-medium"
                      >
                        Open Workspace
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
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
