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
import { 
  Network, 
  Search, 
  Layers, 
  ArrowRight, 
  FileCode2, 
  Info,
  Loader2,
  Maximize2
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

  useEffect(() => {
    Promise.all([
      fetch(`/api/repositories/${repoId}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/repositories/${repoId}/architecture`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([repoData, archData]) => {
        if (repoData?.repository) setRepository(repoData.repository);

        if (archData?.insights?.architecture?.layers && archData.insights.architecture.layers.length > 0) {
          const layers = archData.insights.architecture.layers;
          const dynamicNodes: Node[] = [];
          const dynamicEdges: Edge[] = [];

          layers.forEach((layer: any, idx: number) => {
            const xPos = 80 + (idx % 3) * 320;
            const yPos = 100 + Math.floor(idx / 3) * 160;
            const nodeId = `layer-${idx}`;

            dynamicNodes.push({
              id: nodeId,
              type: 'default',
              data: {
                label: `${layer.name}\n${layer.category || 'Module'}`,
                category: layer.category || 'backend',
                description: layer.description || `Handles ${layer.name} logic.`,
                path: layer.files?.[0] || 'src/',
                functions: layer.files || [],
                incoming: idx > 0 ? [`layer-${idx - 1}`] : [],
                outgoing: idx < layers.length - 1 ? [`layer-${idx + 1}`] : [],
              },
              position: { x: xPos, y: yPos },
              style: {
                background: resolvedTheme === 'dark' ? '#121316' : '#FFFFFF',
                color: resolvedTheme === 'dark' ? '#EDEDED' : '#090A0C',
                border: resolvedTheme === 'dark' ? (idx === 0 ? '1px solid #71717A' : '1px solid #27272A') : (idx === 0 ? '1px solid #090A0C' : '1px solid #E4E5E8'),
                borderRadius: 8,
                padding: 10,
                fontSize: 12,
                boxShadow: resolvedTheme === 'dark' ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.06)',
              },
            });

            if (idx > 0) {
              dynamicEdges.push({
                id: `edge-${idx - 1}-${idx}`,
                source: `layer-${idx - 1}`,
                target: nodeId,
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { stroke: '#52525B' },
              });
            }
          });

          if (dynamicNodes.length > 0) {
            setNodes(dynamicNodes);
            setEdges(dynamicEdges);
            setSelectedNode(dynamicNodes[0].data);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load architecture graph:', err);
      })
      .finally(() => setLoading(false));
  }, [repoId, setEdges, setNodes]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node.data);
  }, []);

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    return nodes.map((node) => {
      const match =
        node.data.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.data.path.toLowerCase().includes(searchQuery.toLowerCase());
      return {
        ...node,
        style: {
          ...node.style,
          opacity: match ? 1 : 0.25,
          border: match ? '2px solid #FFFFFF' : '1px solid #27272A',
        },
      };
    });
  }, [nodes, searchQuery]);

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSidebar repository={repository || ({ id: repoId, name: repoId, owner: '', full_name: repoId, github_url: '', stars: 0, forks: 0, default_branch: 'main', analysis_status: 'completed', created_at: '', updated_at: '' } as Repository)} />

        <div className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-3.5rem)]">
          {/* Header Bar */}
          <div className="h-14 border-b border-border bg-surface-primary px-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <Network className="h-4 w-4 text-txt-primary" />
              <h1 className="text-sm font-semibold text-txt-primary">Architecture Explorer</h1>
              <Badge variant="default" className="text-[10px] font-mono">
                {nodes.length} Modules
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-64 hidden sm:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-txt-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter architecture components..."
                  className="input-field pl-8 py-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Graph Canvas */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
            <div className="flex-1 h-full relative bg-surface-secondary">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center text-txt-muted text-xs gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating architecture topology...
                </div>
              ) : nodes.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-txt-muted text-xs gap-3">
                  <Layers className="h-8 w-8 text-txt-muted" />
                  <p>No architecture layers detected for this repository.</p>
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
              <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border bg-surface-primary p-5 flex flex-col justify-between overflow-y-auto max-h-72 lg:max-h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="section-label">Component Inspector</span>
                    <Badge variant="default" className="text-[10px] capitalize">
                      {selectedNode.category}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-txt-primary">
                      {selectedNode.label.split('\n')[0]}
                    </h3>
                    <p className="text-xs font-mono text-txt-muted mt-0.5 truncate">
                      {selectedNode.path}
                    </p>
                  </div>

                  <p className="text-xs text-txt-secondary leading-relaxed">
                    {selectedNode.description}
                  </p>

                  {selectedNode.functions && selectedNode.functions.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-[11px] font-semibold text-txt-muted uppercase tracking-wider font-mono">
                        Key Files & Handlers
                      </p>
                      <div className="space-y-1">
                        {selectedNode.functions.map((fn: string) => (
                          <div
                            key={fn}
                            className="text-xs font-mono text-txt-secondary bg-surface-secondary px-2 py-1 rounded border border-border truncate"
                          >
                            {fn}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border mt-4">
                  <Link
                    href={`/workspace/${repoId}/files?file=${encodeURIComponent(selectedNode.path)}`}
                    className="btn-secondary w-full text-xs"
                  >
                    <FileCode2 className="h-3.5 w-3.5 mr-1" />
                    Inspect Source Code
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
