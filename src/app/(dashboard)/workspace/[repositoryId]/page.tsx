'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { notionEase } from '@/lib/animations/motion';
import { 
  Network, 
  FileCode2, 
  GitFork, 
  MessageSquare, 
  Map, 
  Bug, 
  Star, 
  GitBranch, 
  Calendar,
  Layers,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Repository, RepositoryInsights } from '@/types';
import { getWorkspaceCache, setWorkspaceCache } from '@/lib/cache/workspace-cache';

export default function WorkspaceOverviewPage() {
  const params = useParams();
  const repoId = params.repositoryId as string;

  const [repository, setRepository] = useState<Repository | null>(() => getWorkspaceCache(repoId)?.repository || null);
  const [insights, setInsights] = useState<RepositoryInsights | null>(() => getWorkspaceCache(repoId)?.insights || null);
  const [loading, setLoading] = useState(() => !getWorkspaceCache(repoId)?.repository);

  useEffect(() => {
    const c = getWorkspaceCache(repoId);
    if (c?.repository) {
      setRepository(c.repository);
      if (c.insights) setInsights(c.insights);
      setLoading(false);
    }

    Promise.all([
      fetch(`/api/repositories/${repoId}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/repositories/${repoId}/architecture`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([repoData, insightsData]) => {
        if (repoData?.repository) {
          setRepository(repoData.repository);
          setWorkspaceCache(repoId, { repository: repoData.repository });
        }
        if (insightsData?.insights) {
          setInsights(insightsData.insights);
          setWorkspaceCache(repoId, { insights: insightsData.insights });
        }
      })
      .catch((err) => {
        console.warn('Could not load live repo workspace:', err);
      })
      .finally(() => setLoading(false));
  }, [repoId]);

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <AppHeader />

      <div className="flex-1 flex">
        <WorkspaceSidebar repository={repository || ({ id: repoId, name: repoId, owner: '', full_name: repoId, github_url: '', stars: 0, forks: 0, default_branch: 'main', analysis_status: 'completed', created_at: '', updated_at: '' } as Repository)} />

        <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-w-5xl">
          {loading ? (
            <div className="card flex items-center justify-center py-20 text-txt-muted text-xs gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading repository intelligence...
            </div>
          ) : !repository ? (
            <div className="card text-center py-16 space-y-4">
              <AlertCircle className="h-10 w-10 text-status-warning mx-auto" />
              <h2 className="text-base font-semibold text-txt-primary">Repository Not Found</h2>
              <p className="text-xs text-txt-secondary max-w-md mx-auto">
                The repository requested has not been indexed or could not be found. You can submit a public repository from the dashboard.
              </p>
              <Link href="/dashboard">
                <Button variant="primary" size="sm">
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: notionEase }}
              className="space-y-8"
            >
              {/* Header */}
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: notionEase }}
                className="space-y-3 pb-6 border-b border-border"
              >
                <div className="flex items-center gap-2 text-xs font-mono text-txt-muted">
                  <span>{repository.owner}</span>
                  <span>/</span>
                  <span className="text-txt-primary">{repository.name}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h1 className="text-2xl font-bold text-txt-primary">{repository.full_name}</h1>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{repository.primary_language || 'Codebase'}</Badge>
                    <Badge variant="success">Indexed</Badge>
                  </div>
                </div>

                <p className="text-sm text-txt-secondary leading-relaxed">
                  {repository.description || 'No description provided for this repository.'}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-txt-muted font-mono pt-2">
                  <span className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-status-warning" />
                    {repository.stars?.toLocaleString() || 0} Stars
                  </span>
                  <span className="flex items-center gap-1.5">
                    <GitFork className="h-3.5 w-3.5" />
                    {repository.forks?.toLocaleString() || 0} Forks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5" />
                    {repository.default_branch} branch
                  </span>
                  {repository.created_at && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Indexed {new Date(repository.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </motion.div>

              {/* AI Repository Overview */}
              {insights?.overview && (
                <motion.div 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.08, ease: notionEase }}
                  className="card space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-txt-primary" />
                    <h2 className="text-sm font-semibold text-txt-primary">Architecture & Purpose Overview</h2>
                  </div>
                  <p className="text-xs text-txt-secondary leading-relaxed whitespace-pre-line">
                    {insights.overview}
                  </p>
                </motion.div>
              )}

              {/* Quick Access Tools */}
              <div>
                <h2 className="text-sm font-semibold text-txt-primary mb-4">Codebase Intelligence Tools</h2>
                <motion.div 
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.06, delayChildren: 0.12 },
                    },
                  }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {[
                    {
                      href: `/workspace/${repoId}/architecture`,
                      icon: Network,
                      title: 'Interactive Architecture',
                      desc: 'Visual graph of modules, entry points, and boundaries.',
                      action: 'Explore Diagram',
                    },
                    {
                      href: `/workspace/${repoId}/files`,
                      icon: FileCode2,
                      title: 'File Explorer',
                      desc: 'Source tree viewer with grounded AI explanations for each file.',
                      action: 'Browse Files',
                    },
                    {
                      href: `/workspace/${repoId}/chat`,
                      icon: MessageSquare,
                      title: 'Ask Your Codebase',
                      desc: 'RAG-powered conversational assistant with verifiable code citations.',
                      action: 'Open Assistant',
                    },
                    {
                      href: `/workspace/${repoId}/dependencies`,
                      icon: GitFork,
                      title: 'Dependencies',
                      desc: 'Production and development packages extracted from manifests.',
                      action: 'View Dependencies',
                    },
                    {
                      href: `/workspace/${repoId}/roadmap`,
                      icon: Map,
                      title: 'Contributor Roadmap',
                      desc: 'Structured step-by-step onboarding plan for contributors.',
                      action: 'View Roadmap',
                    },
                    {
                      href: `/workspace/${repoId}/issues`,
                      icon: Bug,
                      title: 'Feature & Bug Locator',
                      desc: 'Find exact files and functions to modify for new features or bugfixes.',
                      action: 'Locate Code',
                    },
                  ].map((tool) => (
                    <motion.div
                      key={tool.title}
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: notionEase } },
                      }}
                      whileHover={{ y: -3, transition: { duration: 0.18, ease: notionEase } }}
                    >
                      <Link
                        href={tool.href}
                        className="card-hover p-4 flex flex-col justify-between h-full group block"
                      >
                        <div>
                          <tool.icon className="h-5 w-5 text-txt-primary mb-2 group-hover:scale-105 transition-transform" />
                          <h3 className="text-sm font-semibold text-txt-primary">{tool.title}</h3>
                          <p className="text-xs text-txt-secondary mt-1">
                            {tool.desc}
                          </p>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-txt-primary font-medium">
                          {tool.action} <ArrowRight className="h-3 w-3 ml-1" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
