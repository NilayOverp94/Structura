'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { notionEase } from '@/lib/animations/motion';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  FileCode2, 
  Copy, 
  Check, 
  CornerDownLeft,
  Bot,
  User,
  Plus
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Repository } from '@/types';
import { getUserPreferences, UserPreferences } from '@/lib/settings/user-settings';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: { file_path: string; start_line: number; end_line: number; snippet?: string }[];
  timestamp: string;
}

export default function AskCodebasePage() {
  const params = useParams();
  const repoId = (params?.repositoryId as string) || '';

  const [repository, setRepository] = useState<Repository | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am Structura, your AI codebase navigation engineer.\n\nI answer technical questions grounded exclusively in the indexed source code and architecture of this repository. Every answer includes verifiable citations to actual file paths and line ranges.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  useEffect(() => {
    setPrefs(getUserPreferences());
  }, []);

  useEffect(() => {
    fetch(`/api/repositories/${repoId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.repository) {
          setRepository(data.repository);
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: `Hello! I am Structura, your AI codebase navigation engineer for **${data.repository.full_name}**.\n\nI answer technical questions grounded exclusively in the indexed source code and architecture of this repository. Ask about execution entry points, dependencies, or how to implement a specific feature.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      })
      .catch(() => {});
  }, [repoId]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const activeId = repoId || repository?.id;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (prefs?.geminiApiKey && prefs.geminiApiKey.trim()) {
        headers['x-gemini-key'] = prefs.geminiApiKey.trim();
      }

      const response = await fetch(`/api/repositories/${activeId}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: textToSend.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate response.');
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No response returned.',
        citations: data.citations || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.warn('Chat API error:', err);
      const errorMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message || 'Could not query codebase. Please ensure the repository is indexed and try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestedQuestions = [
    `How is the repository structured and what is the main entry point?`,
    `What are the core dependencies and architectural boundaries?`,
    `Where are the configuration manifests and environment variables defined?`,
    `How do I run tests and build this project locally?`,
  ];

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSidebar repository={repository || ({ id: repoId, name: repoId, owner: '', full_name: repoId, github_url: '', stars: 0, forks: 0, default_branch: 'main', analysis_status: 'completed', created_at: '', updated_at: '' } as Repository)} />

        <main className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-surface-secondary">
          {/* Chat Header */}
          <div className="h-12 border-b border-border bg-surface-primary px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-txt-primary" />
              <span className="text-xs font-semibold text-txt-primary">Ask Your Codebase</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMessages([
                  {
                    id: 'welcome',
                    role: 'assistant',
                    content: `Session reset. Ready for technical codebase questions.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
              }}
              className="text-xs h-8 text-txt-muted hover:text-txt-primary"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Conversation
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.24, ease: notionEase }}
                className={`flex gap-3 max-w-3xl ${
                  msg.role === 'user' ? 'ml-auto justify-end' : ''
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`space-y-3 rounded-xl p-4 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-zinc-900 dark:bg-zinc-800 text-zinc-100 border border-zinc-700/60 max-w-xl shadow-sm'
                      : 'card bg-surface-primary max-w-2xl'
                  }`}
                >
                  <div
                    className={`whitespace-pre-line ${
                      msg.role === 'user' ? 'text-zinc-100 font-normal' : 'text-txt-primary'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-3 border-t border-border space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-txt-muted font-mono">
                        Source Citations
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.citations.map((cite, idx) => (
                          <motion.div
                            key={idx}
                            whileHover={{ y: -2, transition: { duration: 0.15 } }}
                          >
                            <Link
                              href={`/workspace/${repoId}/files?file=${encodeURIComponent(cite.file_path)}`}
                              className="p-2 rounded bg-surface-secondary border border-border hover:border-zinc-500 transition-colors block text-left"
                            >
                              <div className="flex items-center gap-1.5 text-txt-primary font-mono text-[11px] truncate">
                                <FileCode2 className="h-3 w-3 text-txt-muted flex-shrink-0" />
                                <span className="truncate">{cite.file_path}</span>
                              </div>
                              <p className="text-[10px] text-txt-muted mt-0.5 font-mono">
                                Lines {cite.start_line}–{cite.end_line}
                              </p>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.role === 'assistant' && (
                    <div className="flex items-center justify-between pt-1 text-[10px] text-txt-muted">
                      <span>{msg.timestamp}</span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-txt-primary flex items-center gap-1"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-status-success" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-800 border border-zinc-700/80 flex items-center justify-center flex-shrink-0 text-white dark:text-zinc-100 font-bold text-xs shadow-sm">
                    {(typeof window !== 'undefined' ? (localStorage.getItem('structura_username') || prefs?.displayName || 'N') : 'N').trim().charAt(0).toUpperCase()}
                  </div>
                )}
              </motion.div>
            ))}

            {loading && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 max-w-3xl"
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="card bg-surface-primary p-4 space-y-2 text-xs text-txt-secondary flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-txt-primary animate-pulse" />
                  Searching code chunks and synthesizing response...
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-1.5 max-w-3xl mx-auto">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="text-[11px] bg-surface-primary hover:bg-surface-tertiary border border-border text-txt-secondary hover:text-txt-primary px-2.5 py-1 rounded-full transition-colors truncate max-w-xs"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box */}
          <div className="p-4 border-t border-border bg-surface-primary">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="max-w-3xl mx-auto relative flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about architecture, functions, entry points, or implementation logic..."
                className="input-field pr-10 py-2.5 text-xs font-mono"
                disabled={loading}
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!input.trim() || loading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
