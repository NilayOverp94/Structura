'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Bug, 
  Search, 
  FileCode2, 
  ArrowRight, 
  Loader2,
  Sparkles
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocateResult, Repository } from '@/types';
import { getUserPreferences } from '@/lib/settings/user-settings';

export default function BugFeatureLocatorPage() {
  const params = useParams();
  const repoId = (params?.repositoryId as string) || '';

  const [repository, setRepository] = useState<Repository | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LocateResult[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetch(`/api/repositories/${repoId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.repository) setRepository(data.repository);
      })
      .catch(() => {});
  }, [repoId]);

  const sampleQueries = [
    'Where is user authentication and session verification handled?',
    'Where are API endpoints for repository analysis defined?',
    'How do I add a new database table or schema migration?',
    'Where are HTTP middleware and request headers configured?',
  ];

  const handleSearch = async (textToSearch?: string) => {
    const q = textToSearch || query;
    if (!q.trim() || loading) return;

    setLoading(true);
    setHasSearched(true);
    if (textToSearch) setQuery(textToSearch);

    try {
      const prefs = getUserPreferences();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (prefs?.geminiApiKey && prefs.geminiApiKey.trim()) {
        headers['x-gemini-key'] = prefs.geminiApiKey.trim();
      }

      const response = await fetch(`/api/repositories/${repoId}/locate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: q.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setResults(data.results || []);
      setSummary(data.summary || '');
    } catch {
      setResults([]);
      setSummary('No matching source code locations could be found for this description.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSidebar repository={repository || ({ id: repoId, name: repoId, owner: '', full_name: repoId, github_url: '', stars: 0, forks: 0, default_branch: 'main', analysis_status: 'completed', created_at: '', updated_at: '' } as Repository)} />

        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-4xl">
          {/* Header */}
          <div className="space-y-2 pb-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-txt-primary" />
              <h1 className="text-xl font-bold text-txt-primary">Bug & Feature Locator</h1>
            </div>
            <p className="text-xs text-txt-secondary leading-relaxed">
              Describe a feature you want to add or a bug you need to trace. Structura ranks the exact source files and line ranges where changes should be made.
            </p>
          </div>

          {/* Search Form */}
          <div className="card space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Where are user sessions and cookies authenticated?"
                  className="input-field pl-10 text-xs font-mono"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!query.trim() || loading}
                className="flex-shrink-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Locate Code
              </Button>
            </form>

            {/* Sample Queries */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-txt-muted">Suggestions:</span>
              {sampleQueries.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(sample)}
                  className="text-[11px] bg-surface-primary hover:bg-surface-tertiary border border-border text-txt-secondary hover:text-txt-primary px-2.5 py-1 rounded-full transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Results Area */}
          {loading && (
            <div className="card flex items-center justify-center py-16 text-txt-muted text-xs gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Scanning AST indexes and locating relevant components...
            </div>
          )}

          {!loading && hasSearched && (
            <div className="space-y-4">
              {summary && (
                <div className="card p-4 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-txt-primary">
                    <Sparkles className="h-4 w-4 text-txt-primary" />
                    AI Implementation Context
                  </div>
                  <p className="text-xs text-txt-secondary leading-relaxed">
                    {summary}
                  </p>
                </div>
              )}

              {results.length === 0 ? (
                <div className="card text-center py-12 text-xs text-txt-muted">
                  No code files found matching your query description.
                </div>
              ) : (
                <div className="space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">
                    Ranked Relevant Files ({results.length})
                  </h2>

                  {results.map((res, idx) => (
                    <div key={idx} className="card p-5 space-y-3.5 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/60">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-white font-bold border border-zinc-700">
                            #{res.suggested_order || idx + 1}
                          </span>
                          <FileCode2 className="h-4 w-4 text-txt-primary flex-shrink-0" />
                          <span className="text-xs font-mono font-semibold text-txt-primary truncate">
                            {res.file_path}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={res.relevance === 'directly_relevant' ? 'default' : 'info'}
                            className="text-[10px] uppercase font-mono capitalize"
                          >
                            {res.relevance.replace('_', ' ')}
                          </Badge>
                          <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                            Recommendation
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-txt-muted font-mono">
                          Relevance Rationale
                        </p>
                        <p className="text-xs text-txt-secondary leading-relaxed">
                          {res.why_relevant}
                        </p>
                      </div>

                      {/* Implementation Approach */}
                      {res.implementation_approach && (
                        <div className="p-3 rounded-lg bg-surface-primary border border-border/80 text-xs space-y-1">
                          <p className="text-[11px] font-semibold text-txt-primary font-mono flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-txt-primary" />
                            Suggested Implementation Approach:
                          </p>
                          <p className="text-txt-secondary text-xs leading-relaxed">
                            {res.implementation_approach}
                          </p>
                        </div>
                      )}

                      {/* Potential Risks */}
                      {res.potential_risks && res.potential_risks.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-status-warning font-mono">
                            Potential Risks & Affected Modules:
                          </p>
                          <ul className="list-disc list-inside text-xs text-txt-muted space-y-0.5 pl-1">
                            {res.potential_risks.map((risk, rIdx) => (
                              <li key={rIdx}>{risk}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {res.code_snippet && (
                        <div className="text-[11px] font-mono text-txt-muted bg-surface-primary p-2.5 rounded border border-border overflow-x-auto whitespace-pre">
                          {res.code_snippet}
                        </div>
                      )}

                      {/* Functions and Related Modules */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {res.important_functions && res.important_functions.length > 0 && (
                            <>
                              <span className="text-[10px] text-txt-muted font-mono">Key Symbols:</span>
                              {res.important_functions.map((fn) => (
                                <span key={fn} className="text-[10px] font-mono bg-surface-primary px-1.5 py-0.5 rounded border border-border text-txt-secondary">
                                  {fn}
                                </span>
                              ))}
                            </>
                          )}
                        </div>

                        <Link
                          href={`/workspace/${repoId}/files?file=${encodeURIComponent(res.file_path)}`}
                          className="inline-flex items-center gap-1 text-xs text-txt-primary hover:underline font-medium shrink-0"
                        >
                          Inspect File
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
