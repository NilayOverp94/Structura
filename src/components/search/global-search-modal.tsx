'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  FileCode2, 
  Cpu, 
  AlignLeft, 
  Package, 
  BookOpen, 
  X,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { notionEase } from '@/lib/animations/motion';

interface GlobalSearchModalProps {
  repositoryId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({
  repositoryId,
  isOpen,
  onClose,
}: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Global hotkey Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || !repositoryId) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/repositories/${repositoryId}/search?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.ok ? r.json() : { results: [] })
        .then((data) => {
          setResults(data.results || []);
          setSelectedIndex(0);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [query, repositoryId]);

  const filteredResults = results.filter((r) => {
    if (categoryFilter === 'all') return true;
    return r.category === categoryFilter;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'file': return FileCode2;
      case 'symbol': return Cpu;
      case 'content': return AlignLeft;
      case 'dependency': return Package;
      case 'doc': return BookOpen;
      default: return Search;
    }
  };

  const handleSelect = (item: any) => {
    onClose();
    router.push(item.url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: notionEase }}
            className="w-full max-w-2xl rounded-xl border border-border bg-surface-primary shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
          >
            {/* Search Input Bar */}
            <div className="p-3 border-b border-border flex items-center gap-3">
              <Search className="h-4 w-4 text-txt-muted shrink-0 ml-1" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search across files, functions, code lines, docs, and dependencies..."
                className="w-full bg-transparent border-none text-xs text-txt-primary focus:outline-none placeholder:text-txt-muted font-mono"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-txt-muted shrink-0" />}
              <button
                onClick={onClose}
                className="text-txt-muted hover:text-txt-primary p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-border/60 bg-surface-secondary text-[11px] overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All' },
                { id: 'file', label: 'Files' },
                { id: 'symbol', label: 'Symbols' },
                { id: 'content', label: 'Code Lines' },
                { id: 'dependency', label: 'Dependencies' },
                { id: 'doc', label: 'Docs' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2 py-0.5 rounded capitalize transition-colors ${
                    categoryFilter === cat.id
                      ? 'bg-zinc-800 text-white font-medium border border-zinc-700'
                      : 'text-txt-muted hover:text-txt-primary'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {!query.trim() ? (
                <div className="p-8 text-center text-xs text-txt-muted space-y-1">
                  <p>Type to search across the entire indexed repository.</p>
                  <p className="text-[11px] text-txt-muted opacity-70">
                    Find symbols, classes, files, imported dependencies, and documentation.
                  </p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-txt-muted">
                  No matching files or symbols found for &quot;{query}&quot;.
                </div>
              ) : (
                filteredResults.map((item, idx) => {
                  const Icon = getCategoryIcon(item.category);
                  const isSelected = idx === selectedIndex;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between gap-3 transition-colors ${
                        isSelected
                          ? 'bg-surface-secondary text-txt-primary border border-border'
                          : 'text-txt-secondary hover:bg-surface-secondary/70 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-6 h-6 rounded bg-surface-tertiary flex items-center justify-center shrink-0 border border-border/80">
                          <Icon className="h-3 w-3 text-txt-primary" />
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-txt-primary truncate font-mono">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-txt-muted truncate font-mono">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] uppercase tracking-wider font-mono text-txt-muted px-1.5 py-0.5 rounded bg-surface-primary border border-border">
                          {item.category}
                        </span>
                        <ArrowRight className="h-3 w-3 text-txt-muted opacity-60" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-border bg-surface-secondary flex items-center justify-between text-[10px] text-txt-muted font-mono">
              <span>{filteredResults.length} results</span>
              <span>Press ESC to close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
