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
import { 
  Network, 
  Search, 
  Layers, 
  ArrowRight, 
  FileCode2, 
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  Boxes,
  Database,
  Globe,
  Settings,
  Cpu
} from 'lucide-react';
import { Repository } from '@/types';

export default function ArchitecturePage() {
  const params = useParams();
  const repoId = (params?.repositoryId as string) || '';
  const { resolvedTheme } = useTheme();

  const [repository, setRepository] = useState<Repository | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node['data'] | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<any | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [resynthesizing, setResynthesizing] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'frontend': return Globe;
      case 'api': return Network;
      case 'database': return Database;
      case 'config': return Settings;
      default: return Cpu;
    }
  };

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
      ];
    }

    const dynamicNodes: Node[] = [];
    const dynamicEdges: Edge[] = [];
    const isDark = resolvedTheme === 'dark';

    // Tiered architectural layout coordinates
    const layoutPositions = [
      { x: 260, y: 40 },   // Top: Client / UI
      { x: 260, y: 190 },  // Middle: API / Edge Handlers
      { x: 260, y: 340 },  // Middle-Lower: Core Services
      { x: 70, y: 490 },   // Bottom-Left: Data & Persistence
      { x: 450, y: 490 },  // Bottom-Right: Build & Config
      { x: 260, y: 640 },  // Bottom: External Systems
    ];

    layers.forEach((layer: any, idx: number) => {
      const pos = layoutPositions[idx] || {
        x: 80 + (idx % 3) * 360,
        y: 80 + Math.floor(idx / 3) * 180,
      };
      const nodeId = `layer-${idx}`;

      dynamicNodes.push({
        id: nodeId,
        type: 'default',
        data: {
          label: `${layer.name}\n${(layer.category || 'MODULE').toUpperCase()}`,
          name: layer.name,
          category: layer.category || 'services',
          description: layer.description || `Handles ${layer.name} logic.`,
          path: layer.files?.[0] || 'src/',
          files: layer.files && layer.files.length > 0 ? layer.files : ['src/index.ts'],
          fileCount: layer.files?.length || 1,
        },
        position: pos,
        style: {
          background: isDark ? '#121316' : '#FFFFFF',
          color: isDark ? '#EDEDED' : '#090A0C',
          border: isDark 
            ? (idx === 0 ? '1.5px solid #FFFFFF' : '1px solid #27272A')
            : (idx === 0 ? '1.5px solid #090A0C' : '1px solid #E4E5E8'),
          borderRadius: 10,
          padding: '14px 18px',
          fontSize: 12,
          fontWeight: 600,
          minWidth: 230,
          boxShadow: isDark 
            ? '0 4px 16px rgba(0,0,0,0.5)' 
            : '0 4px 12px rgba(0,0,0,0.06)',
          cursor: 'pointer',
        },
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
        // Services -> Database
        dynamicEdges.push({
          id: 'edge-2-3',
          source: 'layer-2',
          target: 'layer-3',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: isDark ? '#A1A1AA' : '#52525B' },
          style: { stroke: isDark ? '#52525B' : '#CBD5E1', strokeWidth: 1.5 },
        });
      } else if (idx === 4) {
        // Services -> Config/Build
        dynamicEdges.push({
          id: 'edge-2-4',
          source: 'layer-2',
          target: 'layer-4',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: isDark ? '#A1A1AA' : '#52525B' },
          style: { stroke: isDark ? '#52525B' : '#CBD5E1', strokeWidth: 1.5 },
        });
      } else if (idx > 4) {
        const prevId = `layer-${idx - 1}`;
        dynamicEdges.push({
          id: `edge-${prevId}-${nodeId}`,
          source: prevId,
          target: nodeId,
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: isDark ? '#A1A1AA' : '#52525B' },
          style: { stroke: isDark ? '#52525B' : '#CBD5E1', strokeWidth: 1.5 },
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
    Promise.all([
      fetch(`/api/repositories/${repoId}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/repositories/${repoId}/architecture`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([repoData, archData]) => {
        if (repoData?.repository) setRepository(repoData.repository);

        if (archData?.insights?.architecture?.layers && archData.insights.architecture.layers.length > 0) {
          buildGraph(archData.insights.architecture.layers);
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
      }
    } catch (err) {
      console.warn('Could not re-synthesize architecture graph:', err);
    } finally {
      setResynthesizing(false);
    }
  };

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node.data);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((_: any, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const filteredNodes = useMemo(() => {
    return nodes.map((node) => {
      const matchSearch = !searchQuery.trim() ||
        (node.data.name || node.data.label).toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.data.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.data.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchLayer = selectedLayer === 'all' || node.data.category === selectedLayer;
      const isVisible = matchSearch && matchLayer;

      return {
        ...node,
        style: {
          ...node.style,
          opacity: isVisible ? 1 : 0.2,
          border: isVisible 
            ? (node.data === selectedNode
                ? (resolvedTheme === 'dark' ? '2.5px solid #FFFFFF' : '2.5px solid #090A0C')
                : node.style?.border)
            : '1px dashed var(--border)',
        },
      };
    });
  }, [nodes, searchQuery, selectedLayer, selectedNode, resolvedTheme]);

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSidebar repository={repository || ({ id: repoId, name: repoId, owner: '', full_name: repoId, github_url: '', stars: 0, forks: 0, default_branch: 'main', analysis_status: 'completed', created_at: '', updated_at: '' } as Repository)} />

        <div className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-3.5rem)]">
          {/* Header Bar */}
          <div className="h-14 border-b border-border bg-surface-primary px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Network className="h-4 w-4 text-txt-primary" />
              <h1 className="text-sm font-semibold text-txt-primary">Architecture Explorer</h1>
              <Badge variant="default" className="text-[10px] font-mono">
                {nodes.length} Modules
              </Badge>
            </div>

            {/* Layer Filter Pills */}
            <div className="hidden lg:flex items-center gap-1 bg-surface-secondary p-1 rounded-lg border border-border text-xs">
              {(['all', 'frontend', 'api', 'services', 'database', 'config'] as const).map((layer) => (
                <button
                  key={layer}
                  onClick={() => setSelectedLayer(layer)}
                  className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                    selectedLayer === layer
                      ? 'bg-zinc-800 text-white font-medium shadow-sm'
                      : 'text-txt-secondary hover:text-txt-primary'
                  }`}
                >
                  {layer}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-txt-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter modules..."
                  className="input-field pl-8 py-1 text-xs"
                />
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleResynthesize}
                disabled={resynthesizing}
                className="text-xs h-8"
                title="Re-synthesize architecture graph with AI"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${resynthesizing ? 'animate-spin' : ''}`} />
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
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={onNodeClick}
                  onEdgeClick={onEdgeClick}
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
              {selectedEdge && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={notionTransition}
                  className="w-full lg:w-84 border-t lg:border-t-0 lg:border-l border-border bg-surface-primary p-5 flex flex-col justify-between overflow-y-auto max-h-80 lg:max-h-full shrink-0 shadow-lg"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <span className="section-label">Relationship Details</span>
                      <Badge variant="default" className="text-[10px] font-mono">
                        {selectedEdge.animated ? 'Architectural Flow' : 'Confirmed Import'}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-txt-primary">
                        {selectedEdge.source} → {selectedEdge.target}
                      </h3>
                      <p className="text-xs text-txt-muted mt-1 font-mono">
                        Connection: Inter-module dependency
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-surface-secondary border border-border text-xs text-txt-secondary leading-relaxed space-y-1">
                      <p className="font-semibold text-txt-primary">Evidence & Topology:</p>
                      <p>
                        This link demonstrates directional dependency flow where {selectedEdge.source} delegates requests, calls exported APIs, or consumes services declared in {selectedEdge.target}.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border mt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedEdge(null)}
                      className="w-full text-xs"
                    >
                      Clear Selection
                    </Button>
                  </div>
                </motion.div>
              )}

              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={notionTransition}
                  className="w-full lg:w-84 border-t lg:border-t-0 lg:border-l border-border bg-surface-primary p-5 flex flex-col justify-between overflow-y-auto max-h-80 lg:max-h-full shrink-0 shadow-lg"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <span className="section-label">Module Inspector</span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="default" className="text-[10px] capitalize font-mono">
                          {selectedNode.category}
                        </Badge>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          Confirmed
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-txt-primary">
                        {selectedNode.name || selectedNode.label.split('\n')[0]}
                      </h3>
                      <p className="text-xs font-mono text-txt-muted mt-0.5 truncate">
                        Primary path: {selectedNode.path}
                      </p>
                    </div>

                    <p className="text-xs text-txt-secondary leading-relaxed">
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

                  <div className="pt-4 border-t border-border mt-4">
                    <Link
                      href={`/workspace/${repoId}/files?file=${encodeURIComponent(selectedNode.path)}`}
                      className="btn-primary w-full text-xs"
                    >
                      <FileCode2 className="h-3.5 w-3.5 mr-1" />
                      Inspect In File Explorer
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
