'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  GitFork, 
  Search, 
  Layers, 
  ExternalLink, 
  Package, 
  ShieldCheck, 
  Tag, 
  Filter
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { Badge } from '@/components/ui/badge';
import { DEMO_REPOSITORY, DEMO_DEPENDENCIES } from '@/lib/demo-data';
import { DependencyInfo, Repository } from '@/types';

export default function DependenciesPage() {
  const params = useParams();
  const repoId = (params?.repositoryId as string) || 'demo-codecompass-repo';

  const [repository, setRepository] = useState<Repository>(DEMO_REPOSITORY);
  const [dependencies, setDependencies] = useState<DependencyInfo[]>(DEMO_DEPENDENCIES);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'production' | 'development'>('all');

  useEffect(() => {
    Promise.all([
      fetch(`/api/repositories/${repoId}`).then((r) => r.json()),
      fetch(`/api/repositories/${repoId}/dependencies`).then((r) => r.json()),
    ])
      .then(([repoData, depData]) => {
        if (repoData?.repository) setRepository(repoData.repository);
        if (depData?.dependencies && depData.dependencies.length > 0) {
          setDependencies(depData.dependencies);
        }
      })
      .catch((err) => {
        console.warn('Could not load live dependencies:', err);
      });
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
        <WorkspaceSidebar repository={repository} />

        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-5xl">
          <div>
            <div className="flex items-center gap-2">
              <GitFork className="h-5 w-5 text-accent" />
              <h1 className="text-xl font-bold text-txt-primary">Dependency & Framework Intelligence</h1>
            </div>
            <p className="text-xs text-txt-secondary mt-1">
              Parsed from manifests (`package.json`, `go.mod`, `Cargo.toml`). Categorized by architectural role.
            </p>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-xs uppercase font-mono text-txt-muted">Total Declared Dependencies</p>
              <p className="text-2xl font-bold font-mono text-txt-primary mt-1">{dependencies.length}</p>
              <p className="text-xs text-txt-secondary mt-0.5">Production & development</p>
            </div>
            <div className="card p-4">
              <p className="text-xs uppercase font-mono text-txt-muted">Production Runtime</p>
              <p className="text-2xl font-bold font-mono text-status-success mt-1">
                {dependencies.filter(d => d.type === 'production').length}
              </p>
              <p className="text-xs text-txt-secondary mt-0.5">Required in production build</p>
            </div>
            <div className="card p-4">
              <p className="text-xs uppercase font-mono text-txt-muted">Development Tooling</p>
              <p className="text-2xl font-bold font-mono text-accent mt-1">
                {dependencies.filter(d => d.type === 'development').length}
              </p>
              <p className="text-xs text-txt-secondary mt-0.5">Compilers, linters & tests</p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search packages by name or purpose..."
                className="input-field pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-surface-secondary border border-border text-xs rounded-lg px-3 py-2 text-txt-primary focus:outline-none focus:border-accent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-surface-secondary border border-border text-xs rounded-lg px-3 py-2 text-txt-primary focus:outline-none focus:border-accent"
              >
                <option value="all">All Types</option>
                <option value="production">Production Only</option>
                <option value="development">Dev Only</option>
              </select>
            </div>
          </div>

          {/* Dependency List Table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-primary border-b border-border text-txt-muted uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Package</th>
                    <th className="py-3 px-4">Version Constraint</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Architectural Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDependencies.map((dep) => (
                    <tr key={dep.name} className="hover:bg-surface-tertiary/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-txt-primary">
                        <div className="flex items-center gap-2">
                          <Package className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                          <span>{dep.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-txt-secondary">
                        {dep.version}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="default" className="text-[10px]">
                          {dep.category || 'General'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={dep.type === 'production' ? 'success' : 'default'} className="text-[10px]">
                          {dep.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-txt-secondary">
                        {dep.purpose || 'General utility dependency'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

