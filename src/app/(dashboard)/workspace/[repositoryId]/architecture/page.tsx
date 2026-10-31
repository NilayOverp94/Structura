'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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

  const buildGraph = useCallback((layers: any[]) => {
    if (!layers || layers.length === 0) return;

    const dynamicNodes: Node[] = [];
    const dynamicEdges: Edge[] = [];

    // Distinct positions for structured visual flow
    const positions = [
      { x: 100, y: 80 },   // Top left
      { x: 500, y: 80 },   // Top right
      { x: 300, y: 240 },  // Center
      { x: 100, y: 400 },  // Bottom left
      { x: 500, y: 400 },  // Bottom right
      { x: 300, y: 540 },  // Lower center
    ];

    layers.forEach((layer: any, idx: number) => {
      const pos = positions[idx] || {
        x: 80 + (idx % 3) * 360,
        y: 80 + Math.floor(idx / 3) * 180,
      };
      const nodeId = `layer-${idx}`;
      const isDark = resolvedTheme === 'dark';

      dynamicNodes.push({
        id: nodeId,
        type: 'default',
        data: {
          label: `${layer.name}\n${layer.category ? layer.category.toUpperCase() : 'MODULE'}`,
          name: layer.name,
          category: layer.category || 'services',
          description: layer.description || `Handles ${layer.name} logic.`,
          path: layer.files?.[0] || 'src/',
          files: layer.files || [],
          fileCount: layer.files?.length || 1,
        },
        position: pos,
        style: {
          background: isDark ? '#121316' : '#FFFFFF',
          color: isDark ? '#EDEDED' : '#090A0C',
          border: isDark 
            ? (idx === 0 ? '1.5px solid #A1A1AA' : '1px solid #27272A')
            : (idx === 0 ? '1.5px solid #090A0C' : '1px solid #E4E5E8'),
          borderRadius: 10,
          padding: '12px 16px',
          fontSize: 12,
          fontWeight: 600,
          minWidth: 220,
          boxShadow: isDark 
            ? '0 4px 16px rgba(0,0,0,0.5)' 
            : '0 4px 12px rgba(0,0,0,0.06)',
          cursor: 'pointer',
        },
      });

      // Connect layers in logical data-flow sequences
      if (idx > 0) {
        const sourceId = idx === 2 ? 'layer-0' : `layer-${idx - 1}`;
        dynamicEdges.push({
          id: `edge-${sourceId}-${nodeId}`,
          source: sourceId,
          target: nodeId,
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: isDark ? '#A1A1AA' : '#52525B' },
          style: { stroke: isDark ? '#52525B' : '#A1A1AA', strokeWidth: 1.5 },
        });

        // Add additional cross-layer connection for deeper topologies
        if (idx === 3 && layers.length > 2) {
          dynamicEdges.push({
            id: `edge-layer-1-${nodeId}`,
            source: 'layer-1',
            target: nodeId,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: isDark ? '#A1A1AA' : '#52525B' },
            style: { stroke: isDark ? '#3F3F46' : '#CBD5E1', strokeWidth: 1.5 },
          });
        }
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
  }, []);

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    return nodes.map((node) => {
      const match =
        (node.data.name || node.data.label).toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.data.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.data.category.toLowerCase().includes(searchQuery.toLowerCase());
      return {
        ...node,
        style: {
          ...node.style,
          opacity: match ? 1 : 0.25,
          border: match 
            ? (resolvedTheme === 'dark' ? '2px solid #FFFFFF' : '2px solid #090A0C')
            : '1px solid var(--border)',
        },
      };
    });
  }, [nodes, searchQuery, resolvedTheme]);

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSidebar repository={repository || ({ id: repoId, name: repoId, owner: '', full_name: repoId, github_url: '', stars: 0, forks: 0, default_branch: 'main', analysis_status: 'completed', created_at: '', updated_at: '' } as Repository)} />

        <div className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-3.5rem)]">
          {/* Header Bar */}
          <div className="h-14 border-b border-border bg-surface-primary px-4 sm:px-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <Network className="h-4 w-4 text-txt-primary" />
              <h1 className="text-sm font-semibold text-txt-primary">Architecture Explorer</h1>
              <Badge variant="default" className="text-[10px] font-mono">
                {nodes.length} Modules
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-60 hidden md:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-txt-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter modules..."
                  className="input-field pl-8 py-1.5 text-xs"
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
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${resynthesizing ? 'animate-spin' : ''}`} />
                {resynthesizing ? 'Analyzing...' : 'Re-synthesize Graph'}
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
            {selectedNode && (
              <div className="w-full lg:w-84 border-t lg:border-t-0 lg:border-l border-border bg-surface-primary p-5 flex flex-col justify-between overflow-y-auto max-h-80 lg:max-h-full shrink-0 shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="section-label">Module Inspector</span>
                    <Badge variant="default" className="text-[10px] capitalize font-mono">
                      {selectedNode.category}
                    </Badge>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
