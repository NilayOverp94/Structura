'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitFork, 
  Search, 
  Layers, 
  Package, 
  Loader2
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { Badge } from '@/components/ui/badge';
import { DependencyInfo, Repository } from '@/types';
import { notionSpring, notionEase, staggerContainer, fadeUpItem } from '@/lib/animations/motion';
import { getWorkspaceCache, setWorkspaceCache } from '@/lib/cache/workspace-cache';

export default function DependenciesPage() {
  const params = useParams();
  const repoId = (params?.repositoryId as string) || '';

  const cached = getWorkspaceCache(repoId);
  const [repository, setRepository] = useState<Repository | null>(() => cached?.repository || null);
  const [dependencies, setDependencies] = useState<DependencyInfo[]>(() => cached?.dependencies || []);
  const [loading, setLoading] = useState(() => !cached?.dependencies || cached.dependencies.length === 0);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'production' | 'development'>('all');

  useEffect(() => {
    const c = getWorkspaceCache(repoId);
    if (c?.dependencies && c.dependencies.length > 0) {
      setDependencies(c.dependencies);
      if (c.repository) setRepository(c.repository);
      setLoading(false);
    }

    Promise.all([
      fetch(`/api/repositories/${repoId}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/repositories/${repoId}/dependencies`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([repoData, depData]) => {
        if (repoData?.repository) {
          setRepository(repoData.repository);
          setWorkspaceCache(repoId, { repository: repoData.repository });
        }
        if (depData?.dependencies && Array.isArray(depData.dependencies)) {
          setDependencies(depData.dependencies);
          setWorkspaceCache(repoId, { dependencies: depData.dependencies });
        }
      })
      .catch((err) => {
        console.warn('Could not load live dependencies:', err);
      })
      .finally(() => setLoading(false));
  }, [repoId]);

  const categories = useMemo(() => {
    const cats = new Set(dependencies.map(d => d.category || 'General'));
    return ['all', ...Array.from(cats)];
  }, [dependencies]);

  const filteredDependencies = useMemo(() => {
    return dependencies.filter((dep) => {
      const matchesSearch = dep.name.toLowerCase().includes(search.toLowerCase()) || 
        (dep.purpose && dep.purpose.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || dep.category === selectedCategory;
      const matchesType = typeFilter === 'all' || dep.type === typeFilter;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [dependencies, search, selectedCategory, typeFilter]);

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSidebar repository={repository || ({ id: repoId, name: repoId, owner: '', full_name: repoId, github_url: '', stars: 0, forks: 0, default_branch: 'main', analysis_status: 'completed', created_at: '', updated_at: '' } as Repository)} />

        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-5xl">
          {/* Header */}
          <div className="space-y-2 pb-6 border-b border-border">
            <div className="flex items-center gap-2">
              <GitFork className="h-5 w-5 text-txt-primary" />
              <h1 className="text-xl font-bold text-txt-primary">Dependencies & Framework Topology</h1>
            </div>
            <p className="text-xs text-txt-secondary leading-relaxed">
              Third-party libraries, toolchains, and internal packages extracted directly from repository manifests.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-txt-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search packages..."
                className="input-field pl-9 py-1.5 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field py-1.5 text-xs w-auto cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c === 'all' ? 'All Categories' : c}
                  </option>
                ))}
              </select>

              <div className="flex rounded-lg border border-border p-0.5 bg-surface-secondary relative">
                {(['all', 'production', 'development'] as const).map((t) => {
                  const isActive = typeFilter === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`relative px-2.5 py-1 text-xs rounded capitalize transition-colors z-10 ${
                        isActive
                          ? 'text-white font-medium'
                          : 'text-txt-secondary hover:text-txt-primary'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="dep-type-pill"
                          className="absolute inset-0 bg-zinc-800 border border-zinc-700 rounded shadow-sm -z-10"
                          transition={notionSpring}
                        />
                      )}
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dependencies List */}
          {loading ? (
            <div className="card flex items-center justify-center py-16 text-txt-muted text-xs gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Scanning package manifests...
            </div>
          ) : filteredDependencies.length === 0 ? (
            <div className="card text-center py-12 space-y-2">
              <Package className="h-8 w-8 text-txt-muted mx-auto" />
              <p className="text-xs text-txt-muted">
                {dependencies.length === 0 
                  ? 'No dependencies detected in repository manifests.' 
                  : 'No packages match the current filter.'}
              </p>
            </div>
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="card divide-y divide-border overflow-hidden p-0"
            >
              {filteredDependencies.map((dep) => (
                <motion.div 
                  key={dep.name} 
                  variants={fadeUpItem}
                  whileHover={{ backgroundColor: 'var(--surface-tertiary)' }}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-txt-primary">
                        {dep.name}
                      </span>
                      <span className="font-mono text-xs text-txt-muted">
                        {dep.version}
                      </span>
                      <Badge variant="default" className="text-[10px]">
                        {dep.type}
                      </Badge>
                    </div>
                    {dep.purpose && (
                      <p className="text-xs text-txt-secondary">{dep.purpose}</p>
                    )}
                  </div>

                  {dep.category && (
                    <Badge variant="default" className="text-[10px] self-start sm:self-center capitalize">
                      {dep.category}
                    </Badge>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
