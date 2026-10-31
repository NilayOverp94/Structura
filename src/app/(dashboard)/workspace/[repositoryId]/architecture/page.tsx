'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { notionEase, notionTransition } from '@/lib/animations/motion';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  Node, 
  Edge,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AppHeader } from '@/components/layout/app-header';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { getUserPreferences } from '@/lib/settings/user-settings';
import { cn } from '@/lib/utils';
import { 
  Network, 
  Search, 
  ArrowRight, 
  FileCode2, 
  Loader2, 
  RefreshCw, 
  Sparkles, 
  Boxes, 
  Database, 
  Globe, 
  Settings, 
  Cpu,
  MessageSquare,
  X
} from 'lucide-react';
import { Repository } from '@/types';
import { getWorkspaceCache, setWorkspaceCache } from '@/lib/cache/workspace-cache';

interface ModuleNodeData {
  id: string;
  name: string;
  category: string;
  description: string;
  path: string;
  files: string[];
  fileCount: number;
}

function getCategoryIcon(category: string) {
  switch (category?.toLowerCase()) {
    case 'frontend': return Globe;
    case 'api': return Network;
    case 'database': return Database;
    case 'config': return Settings;
    default: return Cpu;
  }
}

function ArchitectureNodeComponent({ data, selected }: { data: ModuleNodeData; selected: boolean }) {
  const Icon = getCategoryIcon(data.category);

  return (
    <div
      className={cn(
        "px-4 py-3.5 rounded-xl border transition-all duration-200 min-w-[250px] max-w-[280px] shadow-sm cursor-pointer select-none",
        selected
          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-900 dark:border-white ring-2 ring-zinc-400/40 dark:ring-white/40 shadow-xl scale-[1.02]"
          : "bg-surface-primary text-txt-primary border-border hover:border-zinc-500 hover:shadow-md"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-zinc-400 !border-2 !border-zinc-900 rounded-full"
      />
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("h-3.5 w-3.5", selected ? "text-zinc-300 dark:text-zinc-700" : "text-txt-muted")} />
          <span className={cn(
            "text-[10px] font-mono uppercase tracking-wider font-bold",
            selected ? "text-zinc-300 dark:text-zinc-700" : "text-txt-muted"
          )}>
            {data.category}
          </span>
        </div>
        <span className={cn(
          "text-[10px] font-mono px-2 py-0.5 rounded border",
          selected
            ? "bg-zinc-800 dark:bg-zinc-200 text-zinc-300 dark:text-zinc-800 border-zinc-700 dark:border-zinc-300"
            : "bg-surface-secondary text-txt-muted border-border"
        )}>
          {data.fileCount} {data.fileCount === 1 ? 'file' : 'files'}
        </span>
      </div>

      <div className={cn("font-semibold text-xs truncate mb-1", selected ? "text-white dark:text-zinc-950 font-bold" : "text-txt-primary")}>
        {data.name}
      </div>

      <div className={cn("text-[11px] line-clamp-2 leading-relaxed", selected ? "text-zinc-300 dark:text-zinc-600" : "text-txt-muted")}>
        {data.description}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-zinc-400 !border-2 !border-zinc-900 rounded-full"
      />
    </div>
  );
}

export default function ArchitecturePage() {
  const params = useParams();
  const repoId = (params?.repositoryId as string) || '';
  const { resolvedTheme } = useTheme();

  const [repository, setRepository] = useState<Repository | null>(() => getWorkspaceCache(repoId)?.repository || null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<ModuleNodeData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(() => !getWorkspaceCache(repoId)?.insights?.architecture?.layers);
  const [resynthesizing, setResynthesizing] = useState(false);

  const nodeTypes = useMemo(() => ({
    moduleNode: ArchitectureNodeComponent,
  }), []);

  const buildGraph = useCallback((rawLayers: any[]) => {
    let layers = rawLayers;

    // Safety: If layers is empty or has only 1 generic entry, expand into structured architecture tiers
    if (!layers || layers.length <= 1) {
      const primaryFiles = layers?.[0]?.files || ['src/App.tsx', 'index.html'];
      layers = [
        {
          name: 'Client Interface & UI',
          category: 'frontend',
          description: 'User-facing views, layout components, routing, and client interactions.',
          files: primaryFiles.filter((f: string) => f.includes('html') || f.includes('tsx') || f.includes('jsx') || f.includes('components') || f.includes('App')).slice(0, 8),
        },
        {
          name: 'API Routes & Edge Handlers',
          category: 'api',
          description: 'Serverless functions, API endpoints, request validation, and cloud functions.',
          files: primaryFiles.filter((f: string) => f.includes('api') || f.includes('functions') || f.includes('route')).slice(0, 8),
        },
        {
          name: 'Core Services & Utilities',
          category: 'services',
          description: 'Business logic modules, domain helpers, SDK clients, and algorithms.',
          files: primaryFiles.slice(0, 6),
        },
        {
          name: 'Data & Persistence Layer',
          category: 'database',
          description: 'Database schema, persistent store client, and storage configuration.',
          files: ['supabase/config.toml', 'package.json'],
        },
        {
          name: 'Project Configuration & Tooling',
          category: 'config',
          description: 'Package definitions, TypeScript configuration, and bundler options.',
          files: ['package.json', 'README.md'],
        },
      ];
    }

    const dynamicNodes: Node[] = [];
    const dynamicEdges: Edge[] = [];
    const isDark = resolvedTheme === 'dark';
    const total = layers.length;

    layers.forEach((layer: any, idx: number) => {
      let pos = { x: 300, y: 40 + idx * 160 };
      if (total >= 5) {
        if (idx === 3) pos = { x: 120, y: 520 };
        else if (idx === 4) pos = { x: 480, y: 520 };
        else if (idx > 4) pos = { x: 300, y: 520 + (idx - 4) * 160 };
      }

      const nodeId = `layer-${idx}`;
      const nodeData: ModuleNodeData = {
        id: nodeId,
        name: layer.name,
        category: layer.category || 'services',
        description: layer.description || `Handles ${layer.name} logic.`,
        path: layer.files?.[0] || 'src/',
        files: layer.files && layer.files.length > 0 ? layer.files : ['src/index.ts'],
        fileCount: layer.files?.length || 1,
      };

      dynamicNodes.push({
        id: nodeId,
        type: 'moduleNode',
        data: nodeData,
        position: pos,
      });

      // Connect layers in logical architectural data-flow sequences
      if (idx === 1) {
        // UI -> API
        dynamicEdges.push({
          id: 'edge-0-1',
          source: 'layer-0',
          target: 'layer-1',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: isDark ? '#EDEDED' : '#18181B' },
          style: { stroke: isDark ? '#71717A' : '#A1A1AA', strokeWidth: 2 },
        });
      } else if (idx === 2) {
        // API -> Services
        dynamicEdges.push({
          id: 'edge-1-2',
          source: 'layer-1',
          target: 'layer-2',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: isDark ? '#EDEDED' : '#18181B' },
          style: { stroke: isDark ? '#71717A' : '#A1A1AA', strokeWidth: 2 },
        });
      } else if (idx === 3) {
        dynamicEdges.push({
          id: 'edge-2-3',
          source: 'layer-2',
          target: 'layer-3',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: isDark ? '#EDEDED' : '#18181B' },
          style: { stroke: isDark ? '#71717A' : '#A1A1AA', strokeWidth: 2 },
        });
      } else if (idx === 4) {
        dynamicEdges.push({
          id: 'edge-2-4',
          source: 'layer-2',
          target: 'layer-4',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: isDark ? '#EDEDED' : '#18181B' },
          style: { stroke: isDark ? '#71717A' : '#A1A1AA', strokeWidth: 2 },
        });
      } else if (idx > 4) {
        const prevId = `layer-${idx - 1}`;
        dynamicEdges.push({
          id: `edge-${prevId}-${nodeId}`,
          source: prevId,
          target: nodeId,
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: isDark ? '#EDEDED' : '#18181B' },
          style: { stroke: isDark ? '#71717A' : '#A1A1AA', strokeWidth: 2 },
        });
      }
    });

    setNodes(dynamicNodes);
    setEdges(dynamicEdges);
    if (dynamicNodes.length > 0) {
      setSelectedNode(dynamicNodes[0].data);
    }
  }, [resolvedTheme, setEdges, setNodes]);

  useEffect(() => {
    const cached = getWorkspaceCache(repoId);
    if (cached?.repository) setRepository(cached.repository);
    if (cached?.insights?.architecture?.layers && cached.insights.architecture.layers.length > 1) {
      buildGraph(cached.insights.architecture.layers);
      setLoading(false);
    }

    Promise.all([
      fetch(`/api/repositories/${repoId}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/repositories/${repoId}/architecture`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([repoData, archData]) => {
        if (repoData?.repository) {
          setRepository(repoData.repository);
          setWorkspaceCache(repoId, { repository: repoData.repository });
        }

        if (archData?.insights?.architecture?.layers && archData.insights.architecture.layers.length > 0) {
          buildGraph(archData.insights.architecture.layers);
          setWorkspaceCache(repoId, { insights: archData.insights });
        }
      })
      .catch((err) => {
        console.warn('Could not load architecture graph:', err);
      })
      .finally(() => setLoading(false));
  }, [repoId, buildGraph]);

  const handleResynthesize = async () => {
    setResynthesizing(true);
    try {
      const prefs = getUserPreferences();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (prefs.geminiApiKey) {
        headers['x-gemini-key'] = prefs.geminiApiKey;
      }
      const res = await fetch(`/api/repositories/${repoId}/architecture`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (data?.insights?.architecture?.layers) {
        buildGraph(data.insights.architecture.layers);
        setWorkspaceCache(repoId, { insights: data.insights });
      }
    } catch (err) {
      console.warn('Could not re-synthesize architecture graph:', err);
    } finally {
      setResynthesizing(false);
    }
  };

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node.data);
  }, []);

  const filteredNodes = useMemo(() => {
    return nodes.map((node) => {
      const isSelected = selectedNode?.id === node.id;
      const matchSearch = !searchQuery.trim() ||
        node.data.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.data.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.data.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory = categoryFilter === 'all' || node.data.category.toLowerCase() === categoryFilter;
      const isVisible = matchSearch && matchCategory;

      return {
        ...node,
        selected: isSelected,
        style: {
          opacity: isVisible ? 1 : 0.2,
          transition: 'opacity 0.2s ease',
        },
      };
    });
  }, [nodes, searchQuery, categoryFilter, selectedNode]);

  const categories = ['all', 'frontend', 'api', 'services', 'database', 'config'];

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSidebar repository={repository || ({ id: repoId, name: repoId, owner: '', full_name: repoId, github_url: '', stars: 0, forks: 0, default_branch: 'main', analysis_status: 'completed', created_at: '', updated_at: '' } as Repository)} />

        <div className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-3.5rem)]">
          {/* Header Bar */}
          <div className="h-14 border-b border-border bg-surface-primary px-4 sm:px-6 flex items-center justify-between flex-shrink-0 gap-3">
            <div className="flex items-center gap-3">
              <Network className="h-4 w-4 text-txt-primary" />
              <h1 className="text-sm font-semibold text-txt-primary">Architecture Explorer</h1>
              <Badge variant="default" className="text-[10px] font-mono">
                {nodes.length} Modules
              </Badge>
            </div>

            {/* Category filter pills */}
            <div className="hidden lg:flex items-center gap-1 bg-surface-secondary p-1 rounded-lg border border-border">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-colors",
                    categoryFilter === cat
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold shadow-xs"
                      : "text-txt-muted hover:text-txt-primary"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-44 sm:w-56 hidden md:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-txt-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter modules..."
                  className="input-field pl-8 py-1.5 text-xs w-full"
                />
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleResynthesize}
                disabled={resynthesizing}
                className="text-xs"
                title="Re-synthesize architecture graph with AI"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", resynthesizing ? 'animate-spin' : '')} />
                {resynthesizing ? 'Analyzing...' : 'Re-synthesize'}
              </Button>
            </div>
          </div>

          {/* Graph Canvas */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
            <div className="flex-1 h-full relative bg-surface-secondary">
              {loading ? (
                <div className="flex items-center justify-center h-full text-txt-muted text-xs gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Synthesizing architectural module topology...
                </div>
              ) : nodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-txt-muted text-xs p-6 space-y-3">
                  <Boxes className="h-10 w-10 text-txt-muted" />
                  <p>No architecture layers detected for this repository.</p>
                  <Button size="sm" variant="primary" onClick={handleResynthesize} disabled={resynthesizing}>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Synthesize Modules
                  </Button>
                </div>
              ) : (
                <ReactFlow
                  nodes={filteredNodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={onNodeClick}
                  fitView
                  minZoom={0.2}
                  maxZoom={1.5}
                >
                  <Background color={resolvedTheme === 'dark' ? '#27272A' : '#D4D4D8'} gap={20} size={1} />
                  <Controls className="border border-border rounded-lg overflow-hidden shadow-md" />
                  <MiniMap
                    nodeColor={() => (resolvedTheme === 'dark' ? '#52525B' : '#A1A1AA')}
                    maskColor={resolvedTheme === 'dark' ? 'rgba(9, 10, 12, 0.7)' : 'rgba(255, 255, 255, 0.7)'}
                    className="bg-surface-secondary border border-border rounded-lg"
                  />
                </ReactFlow>
              )}
            </div>

            {/* Component Detail Sidebar */}
            <AnimatePresence>
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={notionTransition}
                  className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border bg-surface-primary p-5 flex flex-col justify-between overflow-y-auto max-h-80 lg:max-h-full shrink-0 shadow-lg"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <span className="section-label">Module Inspector</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] capitalize font-mono">
                          {selectedNode.category}
                        </Badge>
                        <button
                          onClick={() => setSelectedNode(null)}
                          className="p-1 rounded text-txt-muted hover:text-txt-primary hover:bg-surface-secondary transition-colors"
                          title="Close inspector"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-txt-primary">
                        {selectedNode.name}
                      </h3>
                      <p className="text-xs font-mono text-txt-muted mt-1 truncate">
                        Primary entry: {selectedNode.path}
                      </p>
                    </div>

                    <p className="text-xs text-txt-secondary leading-relaxed bg-surface-secondary p-3 rounded-lg border border-border">
                      {selectedNode.description}
                    </p>

                    {selectedNode.files && selectedNode.files.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-txt-muted uppercase tracking-wider font-mono">
                          <span>Encapsulated Files</span>
                          <span>{selectedNode.files.length}</span>
                        </div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {selectedNode.files.map((file: string) => (
                            <Link
                              key={file}
                              href={`/workspace/${repoId}/files?file=${encodeURIComponent(file)}`}
                              className="text-xs font-mono text-txt-secondary hover:text-txt-primary bg-surface-secondary hover:bg-surface-tertiary px-2.5 py-1.5 rounded border border-border truncate flex items-center justify-between group transition-colors"
                            >
                              <span className="truncate">{file}</span>
                              <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border mt-4 space-y-2">
                    <Link
                      href={`/workspace/${repoId}/files?file=${encodeURIComponent(selectedNode.path)}`}
                      className="btn-primary w-full text-xs flex items-center justify-center gap-1.5 py-2"
                    >
                      <FileCode2 className="h-3.5 w-3.5" />
                      Inspect In File Explorer
                    </Link>

                    <Link
                      href={`/workspace/${repoId}/chat?q=${encodeURIComponent(`Explain how the "${selectedNode.name}" module is implemented, what its main dependencies are, and how it interacts with the rest of the application.`)}`}
                      className="btn-secondary w-full text-xs flex items-center justify-center gap-1.5 py-2"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Ask AI About This Module
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
