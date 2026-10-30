import { GitBranch, FileCode2, Network, MessageSquare, Star, GitFork as Fork, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProductPreview() {
  return (
    <section id="product" className="py-20 sm:py-28 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="section-label mb-3">Product Preview</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-txt-primary mb-4">
            A workspace built for code exploration
          </h2>
        </div>

        {/* Mock dashboard */}
        <div className="rounded-xl border border-border bg-surface-secondary overflow-hidden shadow-2xl shadow-black/20">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-primary">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
            </div>
            <div className="flex-1 flex items-center justify-center">
              <span className="text-xs text-txt-muted font-mono">structura.app/workspace</span>
            </div>
          </div>

          <div className="grid grid-cols-12 min-h-[400px]">
            {/* Sidebar */}
            <div className="col-span-3 border-r border-border p-4 hidden md:block">
              <div className="space-y-1 mb-6">
                {[
                  { icon: Network, label: 'Architecture', active: true },
                  { icon: FileCode2, label: 'Files' },
                  { icon: Fork, label: 'Dependencies' },
                  { icon: MessageSquare, label: 'Ask Codebase' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${
                      item.active
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'text-txt-secondary hover:bg-surface-tertiary'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-txt-muted uppercase tracking-wider mb-2">Files</p>
                {['src/', 'components/', 'lib/', 'app/', 'package.json'].map((file) => (
                  <div key={file} className="flex items-center gap-2 px-2 py-1.5 text-xs font-mono text-txt-secondary hover:text-txt-primary cursor-pointer rounded">
                    <ChevronRight className="h-3 w-3 text-txt-muted" />
                    {file}
                  </div>
                ))}
              </div>
            </div>

            {/* Main content */}
            <div className="col-span-12 md:col-span-9 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch className="h-4 w-4 text-txt-muted" />
                    <h3 className="text-base font-semibold text-txt-primary">next.js</h3>
                    <Badge variant="info">React Framework</Badge>
                  </div>
                  <p className="text-sm text-txt-secondary">The React Framework for the Web</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-txt-muted">
                  <span className="flex items-center gap-1"><Star className="h-3 w-3" /> 128k</span>
                  <span className="flex items-center gap-1"><Fork className="h-3 w-3" /> 27k</span>
                </div>
              </div>

              {/* Architecture preview nodes */}
              <div className="relative h-64 rounded-lg border border-border bg-surface-primary overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E202808_1px,transparent_1px),linear-gradient(to_bottom,#1E202808_1px,transparent_1px)] bg-[size:30px_30px]" />
                
                {/* Simulated nodes */}
                {[
                  { label: 'pages/', x: '15%', y: '20%', color: 'border-zinc-700 bg-zinc-800/40 text-zinc-300' },
                  { label: 'server/', x: '55%', y: '15%', color: 'border-zinc-700 bg-zinc-800/40 text-zinc-300' },
                  { label: 'client/', x: '35%', y: '55%', color: 'border-zinc-700 bg-zinc-800/40 text-zinc-300' },
                  { label: 'shared/', x: '70%', y: '50%', color: 'border-zinc-700 bg-zinc-800/40 text-zinc-300' },
                  { label: 'build/', x: '50%', y: '80%', color: 'border-zinc-700 bg-zinc-800/40 text-zinc-300' },
                ].map((node) => (
                  <div
                    key={node.label}
                    className={`absolute px-3 py-1.5 rounded-lg border text-xs font-mono text-txt-secondary ${node.color}`}
                    style={{ left: node.x, top: node.y }}
                  >
                    {node.label}
                  </div>
                ))}

                {/* Simulated connections - using SVG lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="22%" y1="30%" x2="40%" y2="55%" stroke="#2A2D35" strokeWidth="1" />
                  <line x1="60%" y1="25%" x2="72%" y2="50%" stroke="#2A2D35" strokeWidth="1" />
                  <line x1="42%" y1="65%" x2="52%" y2="80%" stroke="#2A2D35" strokeWidth="1" />
                  <line x1="62%" y1="22%" x2="42%" y2="55%" stroke="#2A2D35" strokeWidth="1" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
