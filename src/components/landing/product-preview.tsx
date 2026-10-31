'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  GitBranch, 
  FileCode2, 
  Network, 
  MessageSquare, 
  Star, 
  GitFork as Fork, 
  ChevronRight,
  ArrowRight,
  Bot,
  Package,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function ProductPreview() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'files' | 'dependencies' | 'chat'>('architecture');

  const navItems = [
    { id: 'architecture', icon: Network, label: 'Architecture' },
    { id: 'files', icon: FileCode2, label: 'Files' },
    { id: 'dependencies', icon: Fork, label: 'Dependencies' },
    { id: 'chat', icon: MessageSquare, label: 'Ask Codebase' },
  ] as const;

  return (
    <section id="product" className="py-20 sm:py-28 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="section-label mb-3">Interactive Workspace</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-txt-primary mb-4">
            A workspace built for deep code comprehension
          </h2>
          <p className="text-sm text-txt-secondary max-w-xl mx-auto">
            Switch between modules, trace dependencies, inspect file logic, and ask generative questions with line citations.
          </p>
        </div>

        {/* Dashboard Preview Window */}
        <div className="rounded-xl border border-border bg-surface-secondary overflow-hidden shadow-2xl shadow-black/30">
          {/* Title bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-primary">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
              </div>
              <span className="text-xs text-txt-muted font-mono ml-2">structura.app/workspace/next.js</span>
            </div>
            <Link href="/analyze">
              <Button size="sm" variant="primary" className="text-xs h-7">
                Try Any Repo <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-12 min-h-[440px]">
            {/* Sidebar Tabs */}
            <div className="col-span-12 md:col-span-3 border-b md:border-b-0 md:border-r border-border p-4 bg-surface-primary">
              <div className="space-y-1 mb-6">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-100 border border-zinc-700 shadow-sm'
                          : 'text-txt-secondary hover:bg-surface-secondary hover:text-txt-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="h-3.5 w-3.5" />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="h-3 w-3 text-txt-muted" />}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1 hidden md:block pt-2 border-t border-border">
                <p className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider mb-2 font-mono">Sample Files</p>
                {['src/index.ts', 'src/server/router.ts', 'src/client/hooks.ts', 'package.json'].map((file) => (
                  <button
                    key={file}
                    onClick={() => setActiveTab('files')}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-mono text-txt-secondary hover:text-txt-primary hover:bg-surface-secondary cursor-pointer rounded transition-colors text-left"
                  >
                    <ChevronRight className="h-3 w-3 text-txt-muted" />
                    {file}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="col-span-12 md:col-span-9 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <GitBranch className="h-4 w-4 text-txt-primary" />
                      <h3 className="text-sm font-semibold text-txt-primary">vercel/next.js</h3>
                      <Badge variant="default">TypeScript</Badge>
                      <Badge variant="success">Indexed</Badge>
                    </div>
                    <p className="text-xs text-txt-secondary">The React Framework for production web applications.</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-txt-muted font-mono">
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-status-warning" /> 128k</span>
                    <span className="flex items-center gap-1"><Fork className="h-3 w-3" /> 27k</span>
                  </div>
                </div>

                {/* View 1: Architecture */}
                {activeTab === 'architecture' && (
                  <div className="relative h-72 rounded-xl border border-border bg-surface-primary p-4 overflow-hidden">
                    <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                      <span className="text-xs font-semibold text-txt-primary flex items-center gap-1.5">
                        <Network className="h-3.5 w-3.5 text-txt-primary" /> Multi-Tier Architecture Topology
                      </span>
                      <span className="text-[10px] font-mono text-txt-muted">4 Modules Connected</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 h-[calc(100%-2.5rem)]">
                      <div className="rounded-lg border border-border bg-surface-secondary p-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-txt-primary">Client & Routing</span>
                            <span className="text-[10px] font-mono text-txt-muted">frontend</span>
                          </div>
                          <p className="text-[11px] text-txt-secondary mt-1">App router, page transitions, and hydration.</p>
                        </div>
                        <span className="text-[10px] font-mono text-txt-muted">38 files</span>
                      </div>

                      <div className="rounded-lg border border-border bg-surface-secondary p-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-txt-primary">Server & Edge Handlers</span>
                            <span className="text-[10px] font-mono text-txt-muted">api</span>
                          </div>
                          <p className="text-[11px] text-txt-secondary mt-1">Edge runtime, RSC rendering, and headers.</p>
                        </div>
                        <span className="text-[10px] font-mono text-txt-muted">42 files</span>
                      </div>

                      <div className="rounded-lg border border-border bg-surface-secondary p-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-txt-primary">Core Bundler Pipeline</span>
                            <span className="text-[10px] font-mono text-txt-muted">services</span>
                          </div>
                          <p className="text-[11px] text-txt-secondary mt-1">Turbopack compiler, SWC transforms, and loaders.</p>
                        </div>
                        <span className="text-[10px] font-mono text-txt-muted">65 files</span>
                      </div>

                      <div className="rounded-lg border border-border bg-surface-secondary p-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-txt-primary">Cache & Manifests</span>
                            <span className="text-[10px] font-mono text-txt-muted">config</span>
                          </div>
                          <p className="text-[11px] text-txt-secondary mt-1">Incremental cache, ISR persistence, and presets.</p>
                        </div>
                        <span className="text-[10px] font-mono text-txt-muted">19 files</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* View 2: Files */}
                {activeTab === 'files' && (
                  <div className="rounded-xl border border-border bg-surface-primary p-4 h-72 overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
                      <div className="flex items-center gap-2">
                        <FileCode2 className="h-4 w-4 text-txt-primary" />
                        <span className="text-xs font-mono font-semibold text-txt-primary">packages/next/src/server/web/adapter.ts</span>
                      </div>
                      <Badge variant="default" className="text-[10px]">Critical</Badge>
                    </div>
                    <div className="rounded-lg bg-surface-secondary border border-border p-3 text-[11px] text-txt-secondary leading-relaxed space-y-2">
                      <p className="font-semibold text-txt-primary">AI Explanation:</p>
                      <p>This module acts as the protocol bridge between standard Web Request/Response APIs and Node.js HTTP incoming messages in edge environments.</p>
                      <p className="font-mono text-[10px] text-txt-muted pt-1">Key functions: adapter(), getNextServerInfo(), normalizeHeaders()</p>
                    </div>
                  </div>
                )}

                {/* View 3: Dependencies */}
                {activeTab === 'dependencies' && (
                  <div className="rounded-xl border border-border bg-surface-primary p-4 h-72 overflow-y-auto space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-xs font-semibold text-txt-primary flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-txt-primary" /> Extracted Manifest Dependencies
                      </span>
                      <span className="text-[10px] font-mono text-txt-muted">24 packages</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { name: 'react', ver: '^19.0.0', type: 'production' },
                        { name: 'react-dom', ver: '^19.0.0', type: 'production' },
                        { name: '@swc/core', ver: '^1.4.0', type: 'production' },
                        { name: 'typescript', ver: '^5.4.0', type: 'dev' },
                        { name: 'jest', ver: '^29.7.0', type: 'dev' },
                        { name: 'terser', ver: '^5.31.0', type: 'production' },
                      ].map((pkg) => (
                        <div key={pkg.name} className="p-2.5 rounded-lg border border-border bg-surface-secondary flex items-center justify-between">
                          <span className="font-mono text-txt-primary font-medium text-[11px]">{pkg.name}</span>
                          <span className="font-mono text-txt-muted text-[10px]">{pkg.ver}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* View 4: Ask Codebase */}
                {activeTab === 'chat' && (
                  <div className="rounded-xl border border-border bg-surface-primary p-4 h-72 flex flex-col justify-between">
                    <div className="space-y-3 overflow-y-auto">
                      <div className="flex gap-2.5 items-start">
                        <div className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white text-xs font-bold">
                          N
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 max-w-sm">
                          How does the Next.js router match dynamic route parameters?
                        </div>
                      </div>

                      <div className="flex gap-2.5 items-start">
                        <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-secondary border border-border text-xs text-txt-primary max-w-md leading-relaxed">
                          Routing matches dynamic segments using regex trie compilations in <code className="font-mono text-[10px] bg-surface-tertiary px-1 py-0.5 rounded">packages/next/src/shared/lib/router/utils/route-matcher.ts</code> (Lines 24–48).
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-txt-muted">
                      <span>Grounded in indexed AST chunks</span>
                      <Link href="/analyze" className="text-txt-primary font-medium hover:underline flex items-center gap-1">
                        Try on your repository <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
