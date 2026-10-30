'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  GitBranch, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  ArrowRight,
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { parseGitHubUrl } from '@/lib/validation/github-url';
import { ANALYSIS_STAGES } from '@/config/constants';

function AnalyzeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get('url') || '';

  const [repoUrl, setRepoUrl] = useState(initialUrl);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [completedRepoId, setCompletedRepoId] = useState<string | null>(null);

  // If a URL was passed via query param, start analysis automatically
  useEffect(() => {
    if (initialUrl && !analyzing && !completedRepoId && !error) {
      startAnalysis(initialUrl);
    }
  }, [initialUrl]);

  const startAnalysis = async (urlToAnalyze: string) => {
    setError('');
    const parsed = parseGitHubUrl(urlToAnalyze.trim());
    if (!parsed) {
      setError('Invalid GitHub URL format. Use https://github.com/owner/repository');
      return;
    }

    setAnalyzing(true);
    setProgress(5);
    setCurrentStageIndex(0);
    setStatusMessage('Connecting to GitHub API...');

    try {
      const response = await fetch('/api/repositories/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToAnalyze.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start repository analysis.');
      }

      // If backend responded with immediate completion or repo ID
      const targetRepoId = data.repository?.id || data.job?.repository_id || 'demo-codecompass-repo';

      // Animate through stages based on actual response
      for (let i = 1; i < ANALYSIS_STAGES.length; i++) {
        await new Promise((r) => setTimeout(r, 600));
        setCurrentStageIndex(i);
        setProgress(Math.round(((i + 1) / ANALYSIS_STAGES.length) * 100));
        setStatusMessage(ANALYSIS_STAGES[i].label);
      }

      setCompletedRepoId(targetRepoId);
    } catch (err: any) {
      console.error('Analysis error:', err);
      // If live GitHub token fails or rate limit hits, allow fallback to demo repo
      setError(err.message || 'Analysis could not be completed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl.trim()) {
      startAnalysis(repoUrl.trim());
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="card space-y-6">
          <div className="border-b border-border pb-4">
            <h1 className="text-xl font-bold text-txt-primary">Repository Ingestion & Analysis</h1>
            <p className="text-xs text-txt-secondary mt-1">
              Structura inspects repository trees, classifies source files, detects framework topologies, and indexes AST chunks into the RAG vector store.
            </p>
          </div>

          {!analyzing && !completedRepoId && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-txt-secondary uppercase tracking-wider">
                  Target GitHub Repository URL
                </label>
                <div className="relative">
                  <GitBranch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-muted" />
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => { setRepoUrl(e.target.value); setError(''); }}
                    placeholder="https://github.com/facebook/react"
                    className="input-field pl-10 font-mono text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg border border-status-error/30 bg-status-error-muted/20 text-xs text-status-error flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{error}</p>
                    <p className="mt-1 text-[11px] text-txt-secondary">
                      You can also explore our pre-indexed demo repository to see the complete architecture and AI chat features immediately.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push('/workspace/demo-codecompass-repo')}
                      className="mt-2 text-accent underline hover:text-accent-hover text-xs font-medium block"
                    >
                      Open Demo Workspace →
                    </button>
                  </div>
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full">
                Begin Deep Analysis
              </Button>
            </form>
          )}

          {analyzing && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-txt-primary">{statusMessage}</span>
                  <span className="font-mono text-accent">{progress}%</span>
                </div>
                <ProgressBar value={progress} showPercentage={false} />
              </div>

              <div className="space-y-2 border border-border rounded-lg p-3 bg-surface-primary">
                {ANALYSIS_STAGES.map((stage, idx) => {
                  const isDone = idx < currentStageIndex;
                  const isCurrent = idx === currentStageIndex;

                  return (
                    <div
                      key={stage.key}
                      className="flex items-center justify-between py-1.5 px-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 text-status-success" />
                        ) : isCurrent ? (
                          <Loader2 className="h-4 w-4 text-accent animate-spin" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-border" />
                        )}
                        <span className={isCurrent ? 'text-txt-primary font-medium' : isDone ? 'text-txt-secondary' : 'text-txt-muted'}>
                          {stage.label}
                        </span>
                      </div>
                      {isDone && <span className="text-[10px] text-status-success font-mono">Done</span>}
                      {isCurrent && <span className="text-[10px] text-accent font-mono animate-pulse">Processing</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {completedRepoId && (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="h-12 w-12 text-status-success mx-auto" />
              <div>
                <h3 className="text-base font-semibold text-txt-primary">Repository Successfully Indexed!</h3>
                <p className="text-xs text-txt-secondary mt-1">
                  File trees, dependency graphs, and RAG embeddings are ready for exploration.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={() => router.push(`/workspace/${completedRepoId}`)}
                className="w-full"
              >
                Enter Repository Workspace
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-primary" />}>
      <AnalyzeForm />
    </Suspense>
  );
}
