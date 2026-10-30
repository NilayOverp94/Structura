'use client';

import { useParams } from 'next/navigation';
import { 
  Network, 
  FileCode2, 
  GitFork, 
  MessageSquare, 
  Map, 
  Bug, 
  Star, 
  GitBranch, 
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DEMO_REPOSITORY, DEMO_INSIGHTS } from '@/lib/demo-data';

export default function WorkspaceOverviewPage() {
  const params = useParams();
  const repoId = params.repositoryId as string;

  // In demo mode or if repo is demo id, use DEMO_REPOSITORY
  const repository = DEMO_REPOSITORY;
  const insights = DEMO_INSIGHTS;

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <AppHeader />

      <div className="flex-1 flex">
        <WorkspaceSidebar repository={repository} />

        <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-w-5xl">
          {/* Header */}
          <div className="space-y-3 pb-6 border-b border-border">
            <div className="flex items-center gap-2 text-xs font-mono text-txt-muted">
              <span>{repository.owner}</span>
              <span>/</span>
              <span className="text-txt-primary">{repository.name}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-txt-primary">{repository.full_name}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="info">{repository.primary_language || 'TypeScript'}</Badge>
                <Badge variant="success">Analysis Complete</Badge>
              </div>
            </div>

            <p className="text-sm text-txt-secondary leading-relaxed">
              {repository.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-txt-muted font-mono pt-2">
              <span className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-status-warning" />
                {repository.stars.toLocaleString()} Stars
              </span>
              <span className="flex items-center gap-1.5">
                <GitFork className="h-3.5 w-3.5" />
                {repository.forks.toLocaleString()} Forks
              </span>
              <span className="flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5" />
                {repository.default_branch} branch
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Indexed {new Date(repository.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* AI Repository Overview */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-txt-primary">Architecture & Purpose Overview</h2>
            </div>
            <p className="text-xs text-txt-secondary leading-relaxed whitespace-pre-line">
              {insights.overview}
            </p>
          </div>

          {/* Quick Access Modules */}
          <div>
            <h2 className="text-sm font-semibold text-txt-primary mb-4">Codebase Intelligence Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href={`/workspace/${repoId}/architecture`}
                className="card-hover p-4 flex flex-col justify-between group"
              >
                <div>
                  <Network className="h-5 w-5 text-accent mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-sm font-semibold text-txt-primary">Interactive Architecture</h3>
                  <p className="text-xs text-txt-secondary mt-1">
                    Visual graph of components, entry points, and service boundaries.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs text-accent font-medium">
                  Explore Diagram <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </Link>

              <Link
                href={`/workspace/${repoId}/files`}
                className="card-hover p-4 flex flex-col justify-between group"
              >
                <div>
                  <FileCode2 className="h-5 w-5 text-accent mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-sm font-semibold text-txt-primary">File Intelligence</h3>
                  <p className="text-xs text-txt-secondary mt-1">
                    Tree viewer with beginner-friendly AI explanations for every file.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs text-accent font-medium">
                  Browse Files <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </Link>

              <Link
                href={`/workspace/${repoId}/chat`}
                className="card-hover p-4 flex flex-col justify-between group"
              >
                <div>
                  <MessageSquare className="h-5 w-5 text-accent mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-sm font-semibold text-txt-primary">Ask Your Codebase</h3>
                  <p className="text-xs text-txt-secondary mt-1">
                    RAG-powered conversational assistant with verifiable code citations.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs text-accent font-medium">
                  Start Chat <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </Link>

              <Link
                href={`/workspace/${repoId}/dependencies`}
                className="card-hover p-4 flex flex-col justify-between group"
              >
                <div>
                  <GitFork className="h-5 w-5 text-accent mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-sm font-semibold text-txt-primary">Dependency Map</h3>
                  <p className="text-xs text-txt-secondary mt-1">
                    Categorized breakdown of runtime dependencies, frameworks, and versions.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs text-accent font-medium">
                  View Dependencies <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </Link>

              <Link
                href={`/workspace/${repoId}/roadmap`}
                className="card-hover p-4 flex flex-col justify-between group"
              >
                <div>
                  <Map className="h-5 w-5 text-accent mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-sm font-semibold text-txt-primary">Contributor Roadmap</h3>
                  <p className="text-xs text-txt-secondary mt-1">
                    Step-by-step onboarding phases tailored for newcomer developers.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs text-accent font-medium">
                  Follow Learning Path <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </Link>

              <Link
                href={`/workspace/${repoId}/issues`}
                className="card-hover p-4 flex flex-col justify-between group"
              >
                <div>
                  <Bug className="h-5 w-5 text-accent mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-sm font-semibold text-txt-primary">Bug & Feature Locator</h3>
                  <p className="text-xs text-txt-secondary mt-1">
                    Describe any feature or bug to find exact starting code locations.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs text-accent font-medium">
                  Locate Code <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </Link>
            </div>
          </div>

          {/* Detected Technologies */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-txt-primary">Detected Technologies & Stack</h2>
            <div className="flex flex-wrap gap-2">
              {insights.detected_technologies.map((tech) => (
                <div
                  key={tech.name}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface-primary text-xs"
                >
                  <span className="font-medium text-txt-primary">{tech.name}</span>
                  {tech.version && <span className="font-mono text-txt-muted">{tech.version}</span>}
                  <span className="text-[10px] uppercase font-mono px-1 rounded bg-surface-tertiary text-txt-muted">
                    {tech.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

