'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Map, 
  CheckCircle2, 
  Circle, 
  FileCode2, 
  Sparkles, 
  ArrowRight, 
  HelpCircle, 
  TrendingUp, 
  Layers
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { DEMO_REPOSITORY, DEMO_ROADMAP } from '@/lib/demo-data';
import { Repository, RoadmapPhase } from '@/types';

export default function ContributorRoadmapPage() {
  const params = useParams();
  const repoId = (params?.repositoryId as string) || 'demo-codecompass-repo';

  const [repository, setRepository] = useState<Repository>(DEMO_REPOSITORY);
  const [roadmap, setRoadmap] = useState<RoadmapPhase[]>(DEMO_ROADMAP.roadmap);
  const [progress, setProgress] = useState<Record<string, boolean>>(DEMO_ROADMAP.progress);

  useEffect(() => {
    Promise.all([
      fetch(`/api/repositories/${repoId}`).then((r) => r.json()),
      fetch(`/api/repositories/${repoId}/roadmap/generate`, { method: 'POST' }).then((r) => r.json()),
    ])
      .then(([repoData, roadmapData]) => {
        if (repoData?.repository) setRepository(repoData.repository);
        if (roadmapData?.roadmap && Array.isArray(roadmapData.roadmap)) {
          setRoadmap(roadmapData.roadmap);
        }
      })
      .catch((err) => {
        console.warn('Could not load roadmap:', err);
      });
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
        <WorkspaceSidebar repository={repository} />

        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <Map className="h-5 w-5 text-accent" />
                <h1 className="text-xl font-bold text-txt-primary">Contributor Onboarding Roadmap</h1>
              </div>
              <p className="text-xs text-txt-secondary mt-1">
                A structured learning path synthesized by AI from the actual repository structure to guide your first contribution.
              </p>
            </div>

            <div className="card p-3 min-w-[200px]">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-txt-muted uppercase font-mono text-[10px]">Onboarding Readiness</span>
                <span className="font-mono text-accent font-semibold">{progressPct}%</span>
              </div>
              <ProgressBar value={progressPct} showPercentage={false} size="sm" />
              <p className="text-[10px] text-txt-muted mt-1 text-right">
                {completedCount} of {totalCount} steps completed
              </p>
            </div>
          </div>

          {/* Progressive Phases */}
          <div className="space-y-6">
            {roadmap.map((phase) => (
              <div key={phase.id} className="card space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-semibold text-accent">
                      Phase {phase.phase}
                    </span>
                    <h2 className="text-base font-semibold text-txt-primary mt-0.5">
                      {phase.title}
                    </h2>
                    <p className="text-xs text-txt-secondary mt-1">
                      {phase.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {phase.steps.map((step) => {
                    const isCompleted = Boolean(progress[step.id]);

                    return (
                      <div
                        key={step.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          isCompleted
                            ? 'bg-surface-primary/60 border-status-success/30'
                            : 'bg-surface-primary border-border hover:border-border-light'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleStep(step.id)}
                            className="mt-0.5 flex-shrink-0 text-txt-muted hover:text-accent transition-colors"
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-status-success" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </button>

                          <div className="flex-1 space-y-2 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className={`font-semibold ${isCompleted ? 'text-txt-muted line-through' : 'text-txt-primary'}`}>
                                {step.title}
                              </h3>
                              <Badge
                                variant={
                                  step.difficulty === 'beginner'
                                    ? 'success'
                                    : step.difficulty === 'intermediate'
                                    ? 'warning'
                                    : 'error'
                                }
                                className="text-[10px] capitalize"
                              >
                                {step.difficulty}
                              </Badge>
                            </div>

                            <p className="text-txt-secondary leading-relaxed">
                              {step.explanation}
                            </p>

                            <div className="p-2.5 rounded bg-surface-secondary border border-border/70 space-y-1">
                              <p className="text-[11px] text-txt-muted">
                                <strong className="text-txt-primary">Why it matters:</strong> {step.why_it_matters}
                              </p>
                            </div>

                            {step.relevant_files && step.relevant_files.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                <span className="text-[10px] font-mono text-txt-muted">Files to inspect:</span>
                                {step.relevant_files.map((file) => (
                                  <Link
                                    key={file}
                                    href={`/workspace/${repoId}/files?file=${encodeURIComponent(file)}`}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-tertiary border border-border text-[11px] font-mono text-accent hover:border-accent transition-colors"
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
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
