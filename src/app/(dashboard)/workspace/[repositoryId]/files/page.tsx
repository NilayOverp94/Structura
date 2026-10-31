'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { notionEase, notionTransition } from '@/lib/animations/motion';
import { 
  FileCode2, 
  Search, 
  Sparkles, 
  Copy, 
  Check, 
  Layers, 
  Code,
  Loader2,
  ArrowRight,
  GitFork,
  Cpu
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatFileSize, cn } from '@/lib/utils';
import { Repository, RepositoryFile } from '@/types';
import { getUserPreferences, UserPreferences, DEFAULT_USER_PREFERENCES } from '@/lib/settings/user-settings';
import { FileTreeView } from '@/components/files/file-tree-view';

function FileExplorerContent() {
  const params = useParams();
  const repoId = (params?.repositoryId as string) || '';
  const searchParams = useSearchParams();
  const fileQuery = searchParams.get('file');
  const lineQuery = searchParams.get('line') ? parseInt(searchParams.get('line')!, 10) : null;

  const [repository, setRepository] = useState<Repository | null>(null);
  const [files, setFiles] = useState<RepositoryFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<RepositoryFile | null>(null);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [detailedExplanation, setDetailedExplanation] = useState<any | null>(null);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(lineQuery);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);

  const codeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPrefs(getUserPreferences());
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`/api/repositories/${repoId}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/repositories/${repoId}/files`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([repoData, filesData]) => {
        if (repoData?.repository) setRepository(repoData.repository);
        if (filesData?.files && filesData.files.length > 0) {
          setFiles(filesData.files);
          const initial = fileQuery
            ? filesData.files.find((f: any) => f.file_path === fileQuery) || filesData.files[0]
            : filesData.files[0];
          setSelectedFile(initial);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch workspace files:', err);
      })
      .finally(() => setLoading(false));
  }, [repoId, fileQuery]);

  useEffect(() => {
    if (lineQuery) {
      setHighlightedLine(lineQuery);
      scrollToLine(lineQuery);
    }
  }, [lineQuery]);

  const scrollToLine = (lineNum: number) => {
    setTimeout(() => {
      const el = document.getElementById(`code-line-${lineNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleCopyCode = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExplainFile = async () => {
    if (!selectedFile) return;
    setExplaining(true);
    try {
      const activeId = repoId || repository?.id;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (prefs?.geminiApiKey && prefs.geminiApiKey.trim()) {
        headers['x-gemini-key'] = prefs.geminiApiKey.trim();
      }

      const res = await fetch(`/api/repositories/${activeId}/explain`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ filePath: selectedFile.file_path, content: selectedFile.content }),
      });
      const data = await res.json();
      setDetailedExplanation(data);
    } catch {
      setDetailedExplanation({
        explanation: `This file (${selectedFile.file_path}) defines essential logic for ${selectedFile.language || 'code'} execution.`,
        role_in_project: 'Module processing and application logic',
        importance: 'important',
        key_functions: [],
        incoming_dependencies: [],
        outgoing_dependencies: [],
      });
    } finally {
      setExplaining(false);
    }
  };

  const handleSelectFile = (file: RepositoryFile) => {
    setSelectedFile(file);
    setDetailedExplanation(null);
    setHighlightedLine(null);
  };

  const lines = selectedFile?.content ? selectedFile.content.split('\n') : [];

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSidebar repository={repository || ({ id: repoId, name: repoId, owner: '', full_name: repoId, github_url: '', stars: 0, forks: 0, default_branch: 'main', analysis_status: 'completed', created_at: '', updated_at: '' } as Repository)} />

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-[calc(100vh-3.5rem)]">
          {/* File Tree Sidebar */}
          <div className="w-full md:w-80 border-r border-border bg-surface-primary flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-txt-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search file name or path..."
                  className="input-field pl-8 py-1.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="py-12 text-center text-xs text-txt-muted flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading repository tree...
                </div>
              ) : files.length === 0 ? (
                <p className="p-4 text-xs text-txt-muted text-center">No source files indexed.</p>
              ) : (
                <FileTreeView
                  files={files}
                  selectedFile={selectedFile}
                  onSelectFile={handleSelectFile}
                  searchQuery={search}
                />
              )}
            </div>
          </div>

          {/* Main Viewer & Code Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-surface-secondary">
            {selectedFile ? (
              <>
                {/* File Header */}
                <div className="h-12 border-b border-border bg-surface-primary px-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 truncate">
                    <FileCode2 className="h-4 w-4 text-txt-primary shrink-0" />
                    <span className="text-xs font-mono font-medium text-txt-primary truncate">
                      {selectedFile.file_path}
                    </span>
                    <Badge variant="default" className="text-[10px]">
                      {selectedFile.language || 'Plain Text'}
                    </Badge>
                    <span className="text-[10px] text-txt-muted font-mono hidden sm:inline">
                      {lines.length} lines • {formatFileSize(selectedFile.file_size)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleExplainFile}
                      loading={explaining}
                      className="text-xs h-8"
                    >
                      <Sparkles className="h-3 w-3 mr-1 text-txt-primary" />
                      Explain File
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyCode}
                      className="text-xs h-8"
                      title="Copy code"
                    >
                      {copied ? <Check className="h-3 w-3 text-status-success" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                {/* AI Explanation Drawer if triggered */}
                <AnimatePresence>
                  {detailedExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={notionTransition}
                      className="overflow-hidden border-b border-border bg-surface-primary p-4 shrink-0 shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-semibold text-txt-primary">
                              <Sparkles className="h-3.5 w-3.5 text-txt-primary" />
                              AI File Intelligence & AST Analysis
                              <Badge variant="default" className="text-[9px] uppercase font-mono">
                                {detailedExplanation.importance || 'Important'}
                              </Badge>
                            </div>
                            <p className="text-xs text-txt-secondary leading-relaxed">
                              {detailedExplanation.explanation}
                            </p>
                          </div>
                          <button
                            onClick={() => setDetailedExplanation(null)}
                            className="text-xs text-txt-muted hover:text-txt-primary p-1"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Functions & Classes found */}
                        {detailedExplanation.key_functions && detailedExplanation.key_functions.length > 0 && (
                          <div className="pt-2 border-t border-border/60">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-txt-muted font-mono mb-1.5">
                              Declared Functions & Classes (Click to jump):
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {detailedExplanation.key_functions.map((fn: any, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setHighlightedLine(fn.startLine);
                                    scrollToLine(fn.startLine);
                                  }}
                                  className="text-[11px] font-mono bg-surface-secondary hover:bg-surface-tertiary text-txt-primary px-2 py-0.5 rounded border border-border flex items-center gap-1 transition-colors"
                                >
                                  <Cpu className="h-3 w-3 text-txt-muted" />
                                  <span>{fn.name}</span>
                                  <span className="text-[9px] text-txt-muted">:{fn.startLine}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Dependencies links */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60 text-[11px]">
                          {detailedExplanation.outgoing_dependencies && detailedExplanation.outgoing_dependencies.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-txt-muted font-mono mb-1">
                                Outgoing Dependencies (Imports):
                              </p>
                              <div className="space-y-1">
                                {detailedExplanation.outgoing_dependencies.slice(0, 4).map((f: string) => (
                                  <button
                                    key={f}
                                    onClick={() => {
                                      const target = files.find(file => file.file_path === f);
                                      if (target) handleSelectFile(target);
                                    }}
                                    className="text-txt-secondary hover:text-txt-primary font-mono text-[11px] flex items-center gap-1 truncate text-left"
                                  >
                                    <ArrowRight className="h-3 w-3 shrink-0 text-txt-muted" />
                                    <span className="truncate">{f}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {detailedExplanation.incoming_dependencies && detailedExplanation.incoming_dependencies.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-txt-muted font-mono mb-1">
                                Incoming Dependencies (Imported By):
                              </p>
                              <div className="space-y-1">
                                {detailedExplanation.incoming_dependencies.slice(0, 4).map((f: string) => (
                                  <button
                                    key={f}
                                    onClick={() => {
                                      const target = files.find(file => file.file_path === f);
                                      if (target) handleSelectFile(target);
                                    }}
                                    className="text-txt-secondary hover:text-txt-primary font-mono text-[11px] flex items-center gap-1 truncate text-left"
                                  >
                                    <GitFork className="h-3 w-3 shrink-0 text-txt-muted" />
                                    <span className="truncate">{f}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Code Body with Line Jump & Highlight */}
                <motion.div 
                  ref={codeContainerRef}
                  key={selectedFile.file_path}
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                  className={cn(
                    "flex-1 overflow-auto p-4 font-mono leading-relaxed bg-surface-secondary",
                    prefs.wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
                  )}
                  style={{ fontSize: prefs.codeFontSize }}
                >
                  <table className="w-full border-collapse">
                    <tbody>
                      {lines.map((line, idx) => {
                        const lineNum = idx + 1;
                        const isHighlighted = lineNum === highlightedLine;

                        return (
                          <tr 
                            id={`code-line-${lineNum}`}
                            key={idx} 
                            onClick={() => setHighlightedLine(lineNum)}
                            className={cn(
                              "transition-colors cursor-pointer",
                              isHighlighted 
                                ? "bg-zinc-800/90 border-l-2 border-txt-primary" 
                                : "hover:bg-zinc-800/20"
                            )}
                          >
                            {prefs.showLineNumbers && (
                              <td className={cn(
                                "w-12 select-none text-right pr-4 font-mono text-[11px]",
                                isHighlighted ? "text-white font-bold" : "text-txt-muted opacity-40"
                              )}>
                                {lineNum}
                              </td>
                            )}
                            <td className={cn(
                              "font-mono",
                              isHighlighted ? "text-white font-medium" : "text-txt-primary"
                            )}>
                              {line || ' '}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </motion.div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-txt-muted text-xs p-6 space-y-2">
                <Code className="h-8 w-8 text-txt-muted" />
                <p>Select a file from the repository tree to view contents and AI explanations.</p>
              </div>
            )}
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
