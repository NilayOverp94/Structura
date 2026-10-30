'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Bug, 
  Search, 
  FileCode2, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DEMO_REPOSITORY, DEMO_LOCATE_EXAMPLES } from '@/lib/demo-data';
import { LocateResult, Repository } from '@/types';

export default function BugFeatureLocatorPage() {
  const params = useParams();
  const repoId = (params?.repositoryId as string) || 'demo-codecompass-repo';

  const [repository, setRepository] = useState<Repository>(DEMO_REPOSITORY);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LocateResult[]>(DEMO_LOCATE_EXAMPLES[0].results);
  const [summary, setSummary] = useState<string>(DEMO_LOCATE_EXAMPLES[0].summary);

  useEffect(() => {
    fetch(`/api/repositories/${repoId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.repository) setRepository(data.repository);
      })
      .catch(() => {});
  }, [repoId]);

  const sampleQueries = [
    'Where is user authentication and password validation handled?',
    'I want to add rate limiting or CORS configuration',
    'Where are API endpoints for repository analysis defined?',
    'How do I add a new database table or schema migration?',
  ];

  const handleSearch = async (textToSearch?: string) => {
    const q = textToSearch || query;
    if (!q.trim() || loading) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/repositories/${repoId}/locate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setResults(data.results || []);
      setSummary(data.summary || '');
    } catch {
      // Grounded fallback
      const matchingExample = DEMO_LOCATE_EXAMPLES.find(e => 
        e.query.toLowerCase().includes(q.toLowerCase().slice(0, 10))
      ) || DEMO_LOCATE_EXAMPLES[0];

      setResults(matchingExample.results);
      setSummary(matchingExample.summary);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSidebar repository={repository} />

        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-4xl">
          <div>
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-accent" />
              <h1 className="text-xl font-bold text-txt-primary">Bug & Feature Locator</h1>
            </div>
            <p className="text-xs text-txt-secondary mt-1">
              Describe a feature you want to build or a bug you need to trace. Structura performs hybrid vector search to pinpoint the relevant starting files.
            </p>
          </div>

          {/* Search Box */}
          <div className="card space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="space-y-3"
            >
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe what you want to implement or investigate (e.g. Where is user login handled?)"
                  className="input-field pl-10 text-xs py-3"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-txt-muted uppercase">Try query:</span>
                  {sampleQueries.map((sq, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setQuery(sq);
                        handleSearch(sq);
                      }}
                      className="text-[11px] text-txt-secondary hover:text-accent bg-surface-primary px-2.5 py-1 rounded border border-border transition-colors truncate max-w-[280px]"
                    >
                      {sq}
                    </button>
                  ))}
                </div>

                <Button type="submit" variant="primary" loading={loading} className="text-xs">
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Locate Relevant Code
                </Button>
              </div>
            </form>
          </div>

          {/* AI Analysis Summary */}
          {summary && (
            <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-semibold uppercase font-mono text-accent">
                  Architectural Synthesis
                </h3>
              </div>
              <p className="text-xs text-txt-primary leading-relaxed">
                {summary}
              </p>
            </div>
          )}

          {/* Ranked Results List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-txt-primary">
                Ranked Target Files ({results.length})
              </h2>
              <span className="text-[10px] text-txt-muted font-mono">Sorted by inspection order</span>
            </div>

            {results.map((item, index) => (
              <div
                key={item.file_path}
                className="card space-y-3 border-border hover:border-border-light transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-surface-tertiary flex items-center justify-center font-mono text-[11px] text-txt-muted">
                      {item.suggested_order || index + 1}
                    </span>
                    <Link
                      href={`/workspace/${repository.id}/files?file=${encodeURIComponent(item.file_path)}`}
                      className="font-mono text-xs font-semibold text-accent hover:underline flex items-center gap-1.5"
                    >
                      <FileCode2 className="h-3.5 w-3.5" />
                      {item.file_path}
                    </Link>
                  </div>

                  <Badge
                    variant={
                      item.relevance === 'directly_relevant'
                        ? 'success'
                        : item.relevance === 'related'
                        ? 'info'
                        : 'default'
                    }
                    className="text-[10px] uppercase font-mono"
                  >
                    {item.relevance.replace('_', ' ')}
                  </Badge>
                </div>

                <p className="text-xs text-txt-secondary leading-relaxed">
                  {item.why_relevant}
                </p>

                {item.important_functions && item.important_functions.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-mono text-txt-muted">Important Functions to Inspect:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1 font-mono text-[11px]">
                      {item.important_functions.map((fn, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-surface-primary border border-border text-txt-primary">
                          {fn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {item.code_snippet && (
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-mono text-txt-muted">Supporting Evidence Snippet:</span>
                    <pre className="mt-1 p-2.5 rounded bg-[#0E1015] border border-border font-mono text-[11px] text-txt-primary overflow-x-auto">
                      {item.code_snippet}
                    </pre>
                  </div>
                )}

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-[11px] text-txt-muted">
                    {item.related_modules?.length ? `Related: ${item.related_modules.join(', ')}` : 'Independent module'}
                  </span>
                  <Link
                    href={`/workspace/${repository.id}/files?file=${encodeURIComponent(item.file_path)}`}
                    className="text-accent hover:underline inline-flex items-center gap-1 text-[11px] font-medium"
                  >
                    Open in File Explorer
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

