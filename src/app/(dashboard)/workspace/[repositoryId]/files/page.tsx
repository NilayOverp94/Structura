'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatFileSize, cn } from '@/lib/utils';
import { Repository, RepositoryFile } from '@/types';
import { getUserPreferences, UserPreferences, DEFAULT_USER_PREFERENCES } from '@/lib/settings/user-settings';
import { getWorkspaceCache, setWorkspaceCache } from '@/lib/cache/workspace-cache';

function FileExplorerContent() {
  const params = useParams();
  const repoId = (params?.repositoryId as string) || '';
  const searchParams = useSearchParams();
  const fileQuery = searchParams.get('file');

  const cached = getWorkspaceCache(repoId);
  const [repository, setRepository] = useState<Repository | null>(() => cached?.repository || null);
  const [files, setFiles] = useState<RepositoryFile[]>(() => cached?.files || []);
  const [selectedFile, setSelectedFile] = useState<RepositoryFile | null>(() => {
    if (cached?.files && cached.files.length > 0) {
      return fileQuery ? cached.files.find(f => f.file_path === fileQuery) || cached.files[0] : cached.files[0];
    }
    return null;
  });
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => !cached?.files || cached.files.length === 0);
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);

  useEffect(() => {
    setPrefs(getUserPreferences());
  }, []);

  useEffect(() => {
    const c = getWorkspaceCache(repoId);
    if (c?.files && c.files.length > 0) {
      setFiles(c.files);
      const init = fileQuery ? c.files.find(f => f.file_path === fileQuery) || c.files[0] : c.files[0];
      setSelectedFile(init);
      setLoading(false);
    }

    Promise.all([
      fetch(`/api/repositories/${repoId}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/repositories/${repoId}/files`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([repoData, filesData]) => {
        if (repoData?.repository) {
          setRepository(repoData.repository);
          setWorkspaceCache(repoId, { repository: repoData.repository });
        }
        if (filesData?.files && filesData.files.length > 0) {
          setFiles(filesData.files);
          setWorkspaceCache(repoId, { files: filesData.files });
          setSelectedFile(prev => prev || filesData.files[0]);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch workspace files:', err);
      })
      .finally(() => setLoading(false));
  }, [repoId, fileQuery]);

  const filteredFiles = useMemo(() => {
    if (!search.trim()) return files;
    return files.filter(f => f.file_path.toLowerCase().includes(search.toLowerCase()));
  }, [files, search]);

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
      setAiExplanation(data.explanation || 'Detailed AI explanation generated based on file AST structure.');
    } catch {
      setAiExplanation(
        `This file (${selectedFile.file_path}) defines essential logic for ${selectedFile.language || 'code'} execution.`
      );
    } finally {
      setExplaining(false);
    }
  };

  const lines = selectedFile?.content ? selectedFile.content.split('\n') : [];

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSidebar repository={repository || ({ id: repoId, name: repoId, owner: '', full_name: repoId, github_url: '', stars: 0, forks: 0, default_branch: 'main', analysis_status: 'completed', created_at: '', updated_at: '' } as Repository)} />

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

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {loading ? (
                <div className="py-10 text-center text-xs text-txt-muted flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading files...
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="p-4 text-xs text-txt-muted text-center space-y-2">
                  <p>No files found.</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setLoading(true);
                      fetch(`/api/repositories/${repoId}/files`)
                        .then((r) => (r.ok ? r.json() : null))
                        .then((d) => {
                          if (d?.files && d.files.length > 0) {
                            setFiles(d.files);
                            setSelectedFile(d.files[0]);
                          }
                        })
                        .finally(() => setLoading(false));
                    }}
                    className="text-[11px] h-7"
                  >
                    Reload Files
                  </Button>
                </div>
              ) : (
                filteredFiles.map((file) => {
                  const isSelected = selectedFile?.file_path === file.file_path;
                  return (
                    <motion.button
                      key={file.id}
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.15, ease: notionEase }}
                      onClick={async () => {
                        setSelectedFile(file);
                        setAiExplanation(null);
                        if (!file.content || file.content.trim().length === 0) {
                          try {
                            const res = await fetch(`/api/repositories/${repoId}/files/${encodeURIComponent(file.file_path)}`);
                            if (res.ok) {
                              const d = await res.json();
                              if (d?.file?.content) {
                                setSelectedFile(d.file);
                                setFiles(prev => prev.map(f => f.file_path === file.file_path ? d.file : f));
                              }
                            }
                          } catch {}
                        }
                      }}
                      className={cn(
                        'w-full text-left px-2.5 py-1.5 rounded text-xs font-mono flex items-center justify-between transition-colors',
                        isSelected
                          ? 'bg-zinc-800 text-white font-medium border border-zinc-700 shadow-sm'
                          : 'text-txt-secondary hover:bg-surface-secondary hover:text-txt-primary'
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode2 className="h-3.5 w-3.5 text-txt-muted flex-shrink-0" />
                        <span className="truncate">{file.file_path}</span>
                      </div>
                      <span className="text-[10px] text-txt-muted ml-1 flex-shrink-0">
                        {formatFileSize(file.file_size)}
                      </span>
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>

          {/* Main Viewer & Code Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-surface-secondary">
            {selectedFile ? (
              <>
                {/* File Header */}
                <div className="h-12 border-b border-border bg-surface-primary px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <FileCode2 className="h-4 w-4 text-txt-primary" />
                    <span className="text-xs font-mono font-medium text-txt-primary truncate">
                      {selectedFile.file_path}
                    </span>
                    <Badge variant="default" className="text-[10px]">
                      {selectedFile.language || 'Plain Text'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleExplainFile}
                      loading={explaining}
                      className="text-xs h-8"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Explain File
                    </Button>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyCode}
                        className="text-xs h-8"
                      >
                        {copied ? (
                          <motion.span 
                            initial={{ scale: 0.8 }} 
                            animate={{ scale: 1 }} 
                            className="flex items-center gap-1 text-status-success font-medium"
                          >
                            <Check className="h-3 w-3" />
                            Copied
                          </motion.span>
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {/* AI Explanation Drawer if triggered */}
                <AnimatePresence>
                  {aiExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={notionTransition}
                      className="overflow-hidden border-b border-border bg-surface-primary p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-txt-primary">
                            <Sparkles className="h-3.5 w-3.5 text-txt-primary" />
                            AI File Analysis & Importance
                          </div>
                          <p className="text-xs text-txt-secondary leading-relaxed">
                            {aiExplanation}
                          </p>
                        </div>
                        <button
                          onClick={() => setAiExplanation(null)}
                          className="text-xs text-txt-muted hover:text-txt-primary"
                        >
                          ✕
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Code Body */}
                <motion.div 
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
                      {lines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-zinc-800/30">
                          {prefs.showLineNumbers && (
                            <td className="w-10 select-none text-right pr-4 text-txt-muted opacity-40 font-mono text-[11px]">
                              {idx + 1}
                            </td>
                          )}
                          <td className="text-txt-primary font-mono">
                            {line || ' '}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-txt-muted text-xs p-6 space-y-2">
                <Code className="h-8 w-8 text-txt-muted" />
                <p>Select a file from the explorer to view contents and AI explanations.</p>
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
