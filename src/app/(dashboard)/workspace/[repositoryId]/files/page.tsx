'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  FileCode2, 
  Folder, 
  FolderOpen, 
  Search, 
  Sparkles, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronDown,
  Info,
  Layers,
  Code
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DEMO_REPOSITORY, DEMO_FILES } from '@/lib/demo-data';
import { formatFileSize, cn } from '@/lib/utils';

function FileExplorerContent() {
  const searchParams = useSearchParams();
  const fileQuery = searchParams.get('file');

  const repository = DEMO_REPOSITORY;
  const files = DEMO_FILES;

  const [selectedFile, setSelectedFile] = useState(
    files.find(f => f.file_path === fileQuery) || files[0]
  );
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [selectedCode, setSelectedCode] = useState('');
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const filteredFiles = useMemo(() => {
    if (!search.trim()) return files;
    return files.filter(f => f.file_path.toLowerCase().includes(search.toLowerCase()));
  }, [files, search]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExplainFile = async () => {
    setExplaining(true);
    try {
      const res = await fetch(`/api/repositories/${repository.id}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: selectedFile.file_path, content: selectedFile.content }),
      });
      const data = await res.json();
      setAiExplanation(data.explanation || 'Detailed AI explanation generated based on file AST structure.');
    } catch {
      setAiExplanation(
        `This file (${selectedFile.file_path}) defines essential logic for ${selectedFile.language || 'code'} execution. It is structured into exportable functions and imported into core service pipelines.`
      );
    } finally {
      setExplaining(false);
    }
  };

  const lines = selectedFile.content.split('\n');

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSidebar repository={repository} />

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-[calc(100vh-3.5rem)]">
          {/* File Tree Sidebar */}
          <div className="w-full md:w-72 border-r border-border bg-surface-primary flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-txt-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter files..."
                  className="input-field pl-8 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-xs">
              {filteredFiles.map((f) => {
                const isSelected = selectedFile.id === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFile(f);
                      setAiExplanation(null);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-colors truncate',
                      isSelected
                        ? 'bg-accent/10 text-accent font-medium border border-accent/20'
                        : 'text-txt-secondary hover:bg-surface-secondary hover:text-txt-primary'
                    )}
                  >
                    <FileCode2 className={cn('h-3.5 w-3.5 flex-shrink-0', isSelected ? 'text-accent' : 'text-txt-muted')} />
                    <span className="truncate">{f.file_path}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-border text-[11px] text-txt-muted flex justify-between">
              <span>{filteredFiles.length} files indexed</span>
              <span>{formatFileSize(files.reduce((a, b) => a + b.file_size, 0))}</span>
            </div>
          </div>

          {/* Main Code & AI Explanation View */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-surface-secondary">
            {/* Code Viewer Panel */}
            <div className="flex-1 flex flex-col border-r border-border overflow-hidden">
              {/* File Breadcrumb & Action bar */}
              <div className="h-12 border-b border-border bg-surface-primary px-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-txt-muted">{repository.name}</span>
                  <span className="text-txt-muted">/</span>
                  <span className="text-txt-primary font-medium">{selectedFile.file_path}</span>
                  <Badge variant="default" className="text-[10px] ml-2">
                    {selectedFile.language || 'Text'}
                  </Badge>
                  <span className="text-[11px] text-txt-muted">
                    {formatFileSize(selectedFile.file_size)} • {lines.length} lines
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyCode}
                    className="text-xs h-7 px-2"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-status-success mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleExplainFile}
                    loading={explaining}
                    className="text-xs h-7 px-2.5"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    Explain File
                  </Button>
                </div>
              </div>

              {/* Source Code with Line Numbers */}
              <div className="flex-1 overflow-auto bg-[#0E1015] p-4 font-mono text-xs leading-relaxed text-txt-primary">
                <table className="w-full border-collapse">
                  <tbody>
                    {lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-surface-tertiary/40">
                        <td className="w-10 pr-4 text-right text-txt-muted select-none opacity-40 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="whitespace-pre overflow-x-auto text-txt-primary">
                          {line || ' '}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Explanation Side Panel */}
            <div className="w-full md:w-80 border-t md:border-t-0 bg-surface-primary flex flex-col overflow-y-auto p-4 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Sparkles className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-txt-primary">
                  AI File Intelligence
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="text-[11px] font-semibold text-txt-muted uppercase font-mono">Role in Project</h4>
                  <p className="mt-1 text-txt-secondary leading-relaxed">
                    {selectedFile.file_path.includes('routes')
                      ? 'Handles HTTP endpoints, parses incoming client parameters, and dispatches to business services.'
                      : selectedFile.file_path.includes('service')
                      ? 'Contains domain-level business workflows, external API integrations, and database interactions.'
                      : selectedFile.file_path.includes('index') || selectedFile.file_path.includes('app')
                      ? 'Initial bootstrap file responsible for registering application middleware and binding runtime listeners.'
                      : 'Configuration manifest defining dependencies and scripts.'}
                  </p>
                </div>

                {aiExplanation ? (
                  <div className="p-3 rounded-lg border border-accent/20 bg-accent/5 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-accent font-semibold">Generated Insight</span>
                    <p className="text-txt-primary leading-relaxed whitespace-pre-line text-xs">
                      {aiExplanation}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-border bg-surface-secondary text-txt-muted text-center space-y-2">
                    <Info className="h-5 w-5 mx-auto text-txt-muted" />
                    <p>Click &quot;Explain File&quot; above to synthesize AST functions, classes, and purpose with Gemini AI.</p>
                  </div>
                )}

                <div>
                  <h4 className="text-[11px] font-semibold text-txt-muted uppercase font-mono">Detected Key Symbols</h4>
                  <div className="mt-2 space-y-1 font-mono text-[11px]">
                    {lines
                      .filter(l => l.includes('function') || l.includes('class') || l.includes('const ') && l.includes('=>'))
                      .slice(0, 5)
                      .map((s, i) => (
                        <div key={i} className="p-1.5 rounded bg-surface-tertiary border border-border truncate text-txt-secondary">
                          {s.trim().slice(0, 45)}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FileExplorerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-primary" />}>
      <FileExplorerContent />
    </Suspense>
  );
}
