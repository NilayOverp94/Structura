'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  GitCompare, 
  Layers, 
  Package, 
  GitBranch, 
  Star, 
  GitFork, 
  Check, 
  X, 
  ArrowRight,
  Loader2,
  FolderGit2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { notionEase } from '@/lib/animations/motion';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Repository, RepositoryInsights, DependencyInfo } from '@/types';

function CompareContent() {
  const searchParams = useSearchParams();
  const initialA = searchParams.get('a') || '';
  const initialB = searchParams.get('b') || '';

  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [repoAId, setRepoAId] = useState<string>(initialA);
  const [repoBId, setRepoBId] = useState<string>(initialB);

  const [repoA, setRepoA] = useState<Repository | null>(null);
  const [repoB, setRepoB] = useState<Repository | null>(null);

  const [insightsA, setInsightsA] = useState<RepositoryInsights | null>(null);
  const [insightsB, setInsightsB] = useState<RepositoryInsights | null>(null);

  const [depsA, setDepsA] = useState<DependencyInfo[]>([]);
  const [depsB, setDepsB] = useState<DependencyInfo[]>([]);

  const [loading, setLoading] = useState(true);

  // 1. Fetch available repositories
  useEffect(() => {
    fetch('/api/repositories')
      .then((r) => r.json())
      .then((data) => {
        if (data.repositories && Array.isArray(data.repositories)) {
          setRepositories(data.repositories);
          if (!repoAId && data.repositories.length > 0) {
            setRepoAId(data.repositories[0].id);
          }
          if (!repoBId && data.repositories.length > 1) {
            setRepoBId(data.repositories[1].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 2. Fetch data for Repo A
  useEffect(() => {
    if (!repoAId) return;
    Promise.all([
      fetch(`/api/repositories/${repoAId}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/repositories/${repoAId}/architecture`).then(r => r.ok ? r.json() : null),
      fetch(`/api/repositories/${repoAId}/dependencies`).then(r => r.ok ? r.json() : null),
    ]).then(([rData, aData, dData]) => {
      if (rData?.repository) setRepoA(rData.repository);
      if (aData?.insights) setInsightsA(aData.insights);
      if (dData?.dependencies) setDepsA(dData.dependencies);
    }).catch(() => {});
  }, [repoAId]);

  // 3. Fetch data for Repo B
  useEffect(() => {
    if (!repoBId) return;
    Promise.all([
      fetch(`/api/repositories/${repoBId}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/repositories/${repoBId}/architecture`).then(r => r.ok ? r.json() : null),
      fetch(`/api/repositories/${repoBId}/dependencies`).then(r => r.ok ? r.json() : null),
    ]).then(([rData, aData, dData]) => {
      if (rData?.repository) setRepoB(rData.repository);
      if (aData?.insights) setInsightsB(aData.insights);
      if (dData?.dependencies) setDepsB(dData.dependencies);
    }).catch(() => {});
  }, [repoBId]);

  const depsANames = new Set(depsA.map(d => d.name));
  const depsBNames = new Set(depsB.map(d => d.name));

  const sharedDeps = depsA.filter(d => depsBNames.has(d.name));
  const uniqueDepsA = depsA.filter(d => !depsBNames.has(d.name));
  const uniqueDepsB = depsB.filter(d => !depsANames.has(d.name));

  return (
    <div className="min-h-screen bg-surface-primary text-txt-primary">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: notionEase }}
          className="pb-6 border-b border-border space-y-2"
        >
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-txt-primary" />
            <h1 className="text-xl font-bold tracking-tight text-txt-primary">
              Repository Architectural Comparison
            </h1>
          </div>
          <p className="text-xs text-txt-secondary">
            Cross-evaluate technology stacks, dependency topologies, structural design patterns, and architectural layers between two indexed codebases.
          </p>
        </motion.div>

        {/* Repository Selection Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4 space-y-2">
            <label className="text-xs font-semibold text-txt-muted uppercase tracking-wider font-mono">
              Primary Repository (A)
            </label>
            <select
              value={repoAId}
              onChange={(e) => setRepoAId(e.target.value)}
              className="input-field text-xs font-mono py-2"
            >
              {repositories.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.full_name} ({r.primary_language || 'Code'})
                </option>
              ))}
            </select>
          </div>

          <div className="card p-4 space-y-2">
            <label className="text-xs font-semibold text-txt-muted uppercase tracking-wider font-mono">
              Comparison Repository (B)
            </label>
            <select
              value={repoBId}
              onChange={(e) => setRepoBId(e.target.value)}
              className="input-field text-xs font-mono py-2"
            >
              {repositories.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.full_name} ({r.primary_language || 'Code'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* High-level Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A */}
          <div className="card p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-txt-primary">
                  {repoA?.full_name || 'Repository A'}
                </h2>
                <p className="text-xs text-txt-muted font-mono mt-0.5">
                  {repoA?.default_branch || 'main'} branch
                </p>
              </div>
              <Badge variant="default" className="text-[10px]">
                {repoA?.primary_language || 'Unknown'}
              </Badge>
            </div>

            <p className="text-xs text-txt-secondary line-clamp-2">
              {repoA?.description || 'No description provided.'}
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-txt-muted pt-2 border-t border-border">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-status-warning" />
                {repoA?.stars?.toLocaleString() || 0}
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="h-3 w-3" />
                {repoA?.forks?.toLocaleString() || 0}
              </span>
              <span>{depsA.length} Dependencies</span>
            </div>

            {repoA && (
              <Link
                href={`/workspace/${repoA.id}`}
                className="btn-secondary w-full text-xs text-center inline-block"
              >
                Inspect Workspace A →
              </Link>
            )}
          </div>

          {/* Card B */}
          <div className="card p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-txt-primary">
                  {repoB?.full_name || 'Repository B'}
                </h2>
                <p className="text-xs text-txt-muted font-mono mt-0.5">
                  {repoB?.default_branch || 'main'} branch
                </p>
              </div>
              <Badge variant="default" className="text-[10px]">
                {repoB?.primary_language || 'Unknown'}
              </Badge>
            </div>

            <p className="text-xs text-txt-secondary line-clamp-2">
              {repoB?.description || 'No description provided.'}
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-txt-muted pt-2 border-t border-border">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-status-warning" />
                {repoB?.stars?.toLocaleString() || 0}
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="h-3 w-3" />
                {repoB?.forks?.toLocaleString() || 0}
              </span>
              <span>{depsB.length} Dependencies</span>
            </div>

            {repoB && (
              <Link
                href={`/workspace/${repoB.id}`}
                className="btn-secondary w-full text-xs text-center inline-block"
              >
                Inspect Workspace B →
              </Link>
            )}
          </div>
        </div>

        {/* Architecture & Layers Comparison */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-txt-primary" />
            <h3 className="text-sm font-bold text-txt-primary">Architectural Layers & Topology</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-txt-primary font-mono">{repoA?.name || 'Repo A'} Layers:</p>
              <div className="space-y-1.5">
                {(insightsA?.architecture?.layers || []).map((layer, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-surface-secondary border border-border text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-txt-primary">{layer.name}</span>
                      <p className="text-[11px] text-txt-muted truncate max-w-xs">{layer.description}</p>
                    </div>
                    <Badge variant="default" className="text-[9px] uppercase font-mono capitalize">
                      {layer.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-txt-primary font-mono">{repoB?.name || 'Repo B'} Layers:</p>
              <div className="space-y-1.5">
                {(insightsB?.architecture?.layers || []).map((layer, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-surface-secondary border border-border text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-txt-primary">{layer.name}</span>
                      <p className="text-[11px] text-txt-muted truncate max-w-xs">{layer.description}</p>
                    </div>
                    <Badge variant="default" className="text-[9px] uppercase font-mono capitalize">
                      {layer.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dependency Overlap Matrix */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-txt-primary" />
            <h3 className="text-sm font-bold text-txt-primary">Dependency Matrix & Overlap</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Shared */}
            <div className="p-4 rounded-lg bg-surface-secondary border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-txt-primary font-mono">Shared Packages</span>
                <Badge variant="success" className="text-[10px]">{sharedDeps.length}</Badge>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {sharedDeps.length === 0 ? (
                  <p className="text-[11px] text-txt-muted">No shared dependencies detected.</p>
                ) : (
                  sharedDeps.map(d => (
                    <div key={d.name} className="text-[11px] font-mono text-txt-secondary truncate flex items-center justify-between">
                      <span className="truncate">{d.name}</span>
                      <span className="text-[9px] text-txt-muted">{d.version}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Unique to A */}
            <div className="p-4 rounded-lg bg-surface-secondary border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-txt-primary font-mono">Unique to {repoA?.name || 'A'}</span>
                <Badge variant="default" className="text-[10px]">{uniqueDepsA.length}</Badge>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {uniqueDepsA.slice(0, 15).map(d => (
                  <div key={d.name} className="text-[11px] font-mono text-txt-secondary truncate flex items-center justify-between">
                    <span className="truncate">{d.name}</span>
                    <span className="text-[9px] text-txt-muted">{d.version}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Unique to B */}
            <div className="p-4 rounded-lg bg-surface-secondary border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-txt-primary font-mono">Unique to {repoB?.name || 'B'}</span>
                <Badge variant="default" className="text-[10px]">{uniqueDepsB.length}</Badge>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {uniqueDepsB.slice(0, 15).map(d => (
                  <div key={d.name} className="text-[11px] font-mono text-txt-secondary truncate flex items-center justify-between">
                    <span className="truncate">{d.name}</span>
                    <span className="text-[9px] text-txt-muted">{d.version}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Major Design Differences Summary */}
        <div className="card p-6 space-y-3">
          <h3 className="text-sm font-bold text-txt-primary">Architectural & Pattern Evaluation</h3>
          <div className="p-4 rounded-lg bg-surface-secondary border border-border text-xs text-txt-secondary leading-relaxed space-y-2">
            <p>
              <strong className="text-txt-primary font-mono">{repoA?.name || 'Repository A'}</strong> is written in {repoA?.primary_language || 'code'} with {depsA.length} detected package dependencies across {insightsA?.architecture?.layers?.length || 0} modular layers.
            </p>
            <p>
              <strong className="text-txt-primary font-mono">{repoB?.name || 'Repository B'}</strong> is structured with {depsB.length} package dependencies across {insightsB?.architecture?.layers?.length || 0} layers.
            </p>
            <p>
              {sharedDeps.length > 0 
                ? `Both repositories share common primitives including ${sharedDeps.slice(0, 3).map(d => `\`${d.name}\``).join(', ')}, demonstrating compatible runtime conventions.`
                : 'The repositories operate across distinct ecosystem stacks with no overlapping third-party packages.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RepositoryComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-txt-muted" />
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
