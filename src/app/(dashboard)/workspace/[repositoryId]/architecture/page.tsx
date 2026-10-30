'use client';

import { useState, useCallback, useMemo } from 'react';
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
import { 
  Network, 
  Search, 
  Layers, 
  ArrowRight, 
  FileCode2, 
  Info,
  Maximize2
} from 'lucide-react';
import { DEMO_REPOSITORY, DEMO_INSIGHTS } from '@/lib/demo-data';

// Custom Node styles
const initialNodes: Node[] = [
  {
    id: 'entry-bootstrap',
    type: 'default',
    data: { 
      label: 'Bootstrap & Server\nsrc/index.ts',
      category: 'entry',
      description: 'Main application initialization and HTTP server bootstrap.',
      path: 'src/index.ts',
      functions: ['bootstrap()', 'server.listen()'],
      incoming: [],
      outgoing: ['app-express'],
    },
    position: { x: 50, y: 150 },
    style: { background: '#1E293B', color: '#F8FAFC', border: '1px solid #3B82F6', borderRadius: 8, padding: 10, fontSize: 12 },
  },
  {
    id: 'app-express',
    type: 'default',
    data: { 
      label: 'Express App Configuration\nsrc/app.ts',
      category: 'backend',
      description: 'Mounts CORS, rate-limiting, error handlers, and attaches API routers.',
      path: 'src/app.ts',
      functions: ['createApp()', 'app.use(cors)', 'app.use(rateLimiter)'],
      incoming: ['entry-bootstrap'],
      outgoing: ['route-auth', 'route-repos'],
    },
    position: { x: 300, y: 150 },
    style: { background: '#1E293B', color: '#F8FAFC', border: '1px solid #64748B', borderRadius: 8, padding: 10, fontSize: 12 },
  },
  {
    id: 'route-auth',
    type: 'default',
    data: { 
      label: 'Auth Router\nsrc/routes/auth.ts',
      category: 'api',
      description: 'HTTP POST endpoints for /signup and /login with request validation.',
      path: 'src/routes/auth.ts',
      functions: ['authRouter.post(/signup)', 'authRouter.post(/login)'],
      incoming: ['app-express'],
      outgoing: ['service-auth'],
    },
    position: { x: 550, y: 80 },
    style: { background: '#1E293B', color: '#F8FAFC', border: '1px solid #10B981', borderRadius: 8, padding: 10, fontSize: 12 },
  },
  {
    id: 'route-repos',
    type: 'default',
    data: { 
      label: 'Repositories Router\nsrc/routes/repositories.ts',
      category: 'api',
      description: 'Protected endpoints for repository ingestion and intelligence queries.',
      path: 'src/routes/repositories.ts',
      functions: ['repoRouter.post(/analyze)', 'repoRouter.get(/:id/insights)'],
      incoming: ['app-express'],
      outgoing: ['service-analysis'],
    },
    position: { x: 550, y: 240 },
    style: { background: '#1E293B', color: '#F8FAFC', border: '1px solid #10B981', borderRadius: 8, padding: 10, fontSize: 12 },
  },
  {
    id: 'service-auth',
    type: 'default',
    data: { 
      label: 'Auth Service\nsrc/services/auth-service.ts',
      category: 'services',
      description: 'Bcrypt password hashing and JWT token issuance via Supabase profiles.',
      path: 'src/services/auth-service.ts',
      functions: ['register()', 'login()', 'generateJWT()'],
      incoming: ['route-auth'],
      outgoing: ['db-supabase'],
    },
    position: { x: 800, y: 80 },
    style: { background: '#1E293B', color: '#F8FAFC', border: '1px solid #F59E0B', borderRadius: 8, padding: 10, fontSize: 12 },
  },
  {
    id: 'service-analysis',
    type: 'default',
    data: { 
      label: 'Repo Analysis Service\nsrc/services/repo-analysis-service.ts',
      category: 'services',
      description: 'Coordinates GitHub tree traversal, AST chunking, and Gemini embeddings.',
      path: 'src/services/repo-analysis-service.ts',
      functions: ['startAnalysis()', 'filterSourceFiles()', 'chunkAndEmbedFiles()'],
      incoming: ['route-repos'],
      outgoing: ['gemini-ai', 'db-supabase'],
    },
    position: { x: 800, y: 240 },
    style: { background: '#1E293B', color: '#F8FAFC', border: '1px solid #F59E0B', borderRadius: 8, padding: 10, fontSize: 12 },
  },
  {
    id: 'gemini-ai',
    type: 'default',
    data: { 
      label: 'Gemini 1.5 & Embeddings\nExternal AI Service',
      category: 'external',
      description: 'Google Generative AI SDK for RAG questions, text embeddings, and architecture synthesis.',
      path: 'node_modules/@google/generative-ai',
      functions: ['embedContent()', 'generateContent()'],
      incoming: ['service-analysis'],
      outgoing: [],
    },
    position: { x: 1050, y: 200 },
    style: { background: '#1E293B', color: '#F8FAFC', border: '1px solid #8B5CF6', borderRadius: 8, padding: 10, fontSize: 12 },
  },
  {
    id: 'db-supabase',
    type: 'default',
    data: { 
      label: 'Supabase PostgreSQL & pgvector\nDatabase Layer',
      category: 'database',
      description: 'Persists repositories, file records, and runs vector similarity search RPCs.',
      path: 'supabase/migrations/20240101000000_initial_schema.sql',
      functions: ['search_code_chunks()', 'profiles', 'repositories'],
      incoming: ['service-auth', 'service-analysis'],
      outgoing: [],
    },
    position: { x: 1050, y: 100 },
    style: { background: '#1E293B', color: '#F8FAFC', border: '1px solid #06B6D4', borderRadius: 8, padding: 10, fontSize: 12 },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'entry-bootstrap', target: 'app-express', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e2-3', source: 'app-express', target: 'route-auth', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e2-4', source: 'app-express', target: 'route-repos', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e3-5', source: 'route-auth', target: 'service-auth', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e4-6', source: 'route-repos', target: 'service-analysis', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e5-8', source: 'service-auth', target: 'db-supabase', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e6-7', source: 'service-analysis', target: 'gemini-ai', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e6-8', source: 'service-analysis', target: 'db-supabase', markerEnd: { type: MarkerType.ArrowClosed } },
];

export default function ArchitecturePage() {
  const repository = DEMO_REPOSITORY;
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node['data'] | null>(initialNodes[0].data);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'high-level' | 'detailed'>('high-level');

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data);
  }, []);

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const query = searchQuery.toLowerCase();
    return nodes.map((n) => {
      const match = n.data.label.toLowerCase().includes(query) || (n.data.path && n.data.path.toLowerCase().includes(query));
      return {
        ...n,
        style: {
          ...n.style,
          opacity: match ? 1 : 0.25,
          border: match ? '2px solid #3B82F6' : n.style?.border,
        },
      };
    });
  }, [nodes, searchQuery]);

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSidebar repository={repository} />

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Graph Area */}
          <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] relative">
            {/* Top Toolbar */}
            <div className="h-12 border-b border-border bg-surface-secondary/70 px-4 flex items-center justify-between z-10 gap-3">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-accent" />
                <span className="text-xs font-semibold text-txt-primary">Architecture Topology</span>
                <Badge variant="info">Verified from imports</Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-txt-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search node or file..."
                    className="input-field pl-8 py-1 text-xs"
                  />
                </div>

                <div className="flex items-center rounded-lg border border-border p-0.5 text-xs bg-surface-tertiary">
                  <button
                    onClick={() => setViewMode('high-level')}
                    className={`px-2.5 py-1 rounded ${viewMode === 'high-level' ? 'bg-accent text-white font-medium' : 'text-txt-muted hover:text-txt-secondary'}`}
                  >
                    High Level
                  </button>
                  <button
                    onClick={() => setViewMode('detailed')}
                    className={`px-2.5 py-1 rounded ${viewMode === 'detailed' ? 'bg-accent text-white font-medium' : 'text-txt-muted hover:text-txt-secondary'}`}
                  >
                    Detailed
                  </button>
                </div>
              </div>
            </div>

            {/* React Flow Canvas */}
            <div className="flex-1 w-full h-full bg-[#0d0e12]">
              <ReactFlow
                nodes={filteredNodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                fitView
              >
                <Background color="#2A2D35" gap={20} size={1} />
                <Controls className="bg-surface-secondary border-border fill-txt-primary" />
                <MiniMap
                  nodeStrokeColor="#3B82F6"
                  nodeColor="#1E293B"
                  className="bg-surface-secondary border border-border rounded-lg"
                />
              </ReactFlow>
            </div>
          </div>

          {/* Right Details Panel */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border bg-surface-secondary flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto p-4 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Info className="h-4 w-4 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-txt-primary">
                Node Inspector
              </h2>
            </div>

            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-accent">Component</span>
                  <h3 className="text-sm font-semibold text-txt-primary mt-0.5 whitespace-pre-line">
                    {selectedNode.label}
                  </h3>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-txt-muted">File Path</span>
                  <p className="font-mono text-xs text-txt-secondary mt-0.5 break-all bg-surface-tertiary p-1.5 rounded border border-border">
                    {selectedNode.path}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-txt-muted">Role & Purpose</span>
                  <p className="text-txt-secondary mt-1 leading-relaxed">
                    {selectedNode.description}
                  </p>
                </div>

                {selectedNode.functions && selectedNode.functions.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-mono text-txt-muted">Key Functions & Methods</span>
                    <ul className="mt-1 space-y-1">
                      {selectedNode.functions.map((fn: string) => (
                        <li key={fn} className="font-mono text-[11px] text-txt-primary bg-surface-primary px-2 py-1 rounded border border-border/50">
                          {fn}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 border-t border-border">
                  <span className="text-[10px] uppercase font-mono text-txt-muted">Relationships</span>
                  <div className="mt-2 space-y-1 text-[11px] text-txt-secondary">
                    <p><strong className="text-txt-primary">Incoming:</strong> {selectedNode.incoming?.length ? selectedNode.incoming.join(', ') : 'None (Entry point)'}</p>
                    <p><strong className="text-txt-primary">Outgoing:</strong> {selectedNode.outgoing?.length ? selectedNode.outgoing.join(', ') : 'None (Terminal)'}</p>
                  </div>
                </div>

                <Link
                  href={`/workspace/${repository.id}/files?file=${encodeURIComponent(selectedNode.path)}`}
                  className="btn-primary w-full text-xs text-center justify-center mt-4"
                >
                  <FileCode2 className="h-3.5 w-3.5 mr-1.5" />
                  Inspect Source Code
                </Link>
              </div>
            ) : (
              <p className="text-xs text-txt-muted">Click any node on the graph to inspect its file relationships.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
