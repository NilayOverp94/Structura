'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Map, 
  CheckCircle2, 
  Circle, 
  FileCode2, 
  Loader2
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Repository, RoadmapPhase } from '@/types';
import { getUserPreferences } from '@/lib/settings/user-settings';

export default function ContributorRoadmapPage() {
  const params = useParams();
  const repoId = (params?.repositoryId as string) || '';

  const [repository, setRepository] = useState<Repository | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapPhase[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prefs = getUserPreferences();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (prefs?.geminiApiKey && prefs.geminiApiKey.trim()) {
      headers['x-gemini-key'] = prefs.geminiApiKey.trim();
    }

    Promise.all([
      fetch(`/api/repositories/${repoId}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/repositories/${repoId}/roadmap/generate`, { method: 'POST', headers }).then((r) => r.ok ? r.json() : null),
    ])
      .then(([repoData, roadmapData]) => {
        if (repoData?.repository) setRepository(repoData.repository);
        if (roadmapData?.roadmap && Array.isArray(roadmapData.roadmap)) {
          setRoadmap(roadmapData.roadmap);
        }
      })
      .catch((err) => {
        console.warn('Could not load roadmap:', err);
      })
      .finally(() => setLoading(false));
  }, [repoId]);

  const toggleStep = (stepId: string) => {
    setProgress((prev) => {
      const updated = { ...prev, [stepId]: !prev[stepId] };
      fetch(`/api/repositories/${repoId}/roadmap/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, completed: updated[stepId] }),
      }).catch((err) => console.warn('Progress update sync error:', err));
      return updated;
    });
  };

  const allSteps = roadmap.flatMap((p) => p.steps);
  const completedCount = allSteps.filter((s) => progress[s.id]).length;
  const totalCount = allSteps.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSidebar repository={repository || ({ id: repoId, name: repoId, owner: '', full_name: repoId, github_url: '', stars: 0, forks: 0, default_branch: 'main', analysis_status: 'completed', created_at: '', updated_at: '' } as Repository)} />

        <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-w-4xl">
          {/* Header */}
          <div className="space-y-4 pb-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5 text-txt-primary" />
              <h1 className="text-xl font-bold text-txt-primary">Contributor Onboarding Roadmap</h1>
            </div>
            <p className="text-xs text-txt-secondary leading-relaxed">
              Step-by-step learning progression tailored to the architecture and conventions of this codebase.
            </p>

            {/* Overall Progress */}
            {totalCount > 0 && (
              <div className="card p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-txt-primary">Onboarding Progress</span>
                  <span className="font-mono text-txt-muted">{completedCount} of {totalCount} steps completed ({progressPct}%)</span>
                </div>
                <ProgressBar value={progressPct} showPercentage={false} />
              </div>
            )}
          </div>

          {loading ? (
            <div className="card flex items-center justify-center py-16 text-txt-muted text-xs gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Synthesizing learning roadmap...
            </div>
          ) : roadmap.length === 0 ? (
            <div className="card text-center py-12 text-xs text-txt-muted">
              No roadmap phases generated yet. Ensure repository files are indexed.
            </div>
          ) : (
            <div className="space-y-8">
              {roadmap.map((phase) => {
                const phaseCompleted = phase.steps.every((s) => progress[s.id]);

                return (
                  <div key={phase.id} className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-semibold text-txt-primary">
                            {phase.title}
                          </h2>
                          {phaseCompleted && (
                            <Badge variant="success">Completed</Badge>
                          )}
                        </div>
                        <p className="text-xs text-txt-secondary mt-1">
                          {phase.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {phase.steps.map((step) => {
                        const isDone = !!progress[step.id];

                        return (
                          <div
                            key={step.id}
                            className={`card p-4 transition-colors ${
                              isDone ? 'bg-surface-secondary/40 border-border/60' : 'bg-surface-secondary'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => toggleStep(step.id)}
                                className="mt-0.5 flex-shrink-0 text-txt-muted hover:text-txt-primary"
                              >
                                {isDone ? (
                                  <CheckCircle2 className="h-4 w-4 text-status-success" />
                                ) : (
                                  <Circle className="h-4 w-4" />
                                )}
                              </button>

                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={`text-xs font-semibold ${
                                      isDone ? 'line-through text-txt-muted' : 'text-txt-primary'
                                    }`}
                                  >
                                    {step.title}
                                  </span>

                                  {step.difficulty && (
                                    <Badge variant="default" className="text-[10px] uppercase font-mono">
                                      {step.difficulty}
                                    </Badge>
                                  )}
                                </div>

                                <p className="text-xs text-txt-secondary leading-relaxed">
                                  {step.explanation}
                                </p>

                                {step.why_it_matters && (
                                  <p className="text-[11px] text-txt-muted bg-surface-primary p-2 rounded border border-border">
                                    <strong className="text-txt-primary font-medium">Why it matters:</strong> {step.why_it_matters}
                                  </p>
                                )}

                                {step.relevant_files && step.relevant_files.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    <span className="text-[10px] text-txt-muted font-mono">Files:</span>
                                    {step.relevant_files.map((file) => (
                                      <Link
                                        key={file}
                                        href={`/workspace/${repoId}/files?file=${encodeURIComponent(file)}`}
                                        className="inline-flex items-center gap-1 text-[11px] font-mono text-txt-secondary hover:text-txt-primary bg-surface-primary px-2 py-0.5 rounded border border-border"
                                      >
                                        <FileCode2 className="h-3 w-3" />
                                        {file}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
