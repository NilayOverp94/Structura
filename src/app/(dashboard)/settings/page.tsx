'use client';

import { AppHeader } from '@/components/layout/app-header';
import { Badge } from '@/components/ui/badge';
import { Key, Database, Cpu, GitBranch, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const configs = [
    {
      title: 'Google Gemini AI',
      icon: Cpu,
      description: 'Powers RAG codebase question answering, AST architecture synthesis, and file explanations.',
      varName: 'GEMINI_API_KEY',
      docsUrl: 'https://aistudio.google.com/app/apikey',
      status: process.env.NEXT_PUBLIC_APP_URL ? 'Configurable via .env.local' : 'Configurable',
    },
    {
      title: 'GitHub API Token',
      icon: GitBranch,
      description: 'Used to fetch repository trees, file blobs, and metadata with higher rate limits (5,000 req/hr).',
      varName: 'GITHUB_TOKEN',
      docsUrl: 'https://github.com/settings/tokens',
      status: 'Configurable via .env.local',
    },
    {
      title: 'Supabase PostgreSQL & Vector',
      icon: Database,
      description: 'Stores user accounts, repository metadata, code chunks, and pgvector embeddings.',
      varName: 'NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY',
      docsUrl: 'https://supabase.com/dashboard',
      status: 'Configurable via .env.local',
    },
  ];

  return (
    <div className="min-h-screen bg-surface-primary">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Settings & Integration Status</h1>
          <p className="text-xs text-txt-secondary mt-1">
            Review your environment configuration, API keys, and model parameters.
          </p>
        </div>

        <div className="space-y-4">
          {configs.map((cfg) => (
            <div key={cfg.title} className="card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-surface-tertiary border border-border">
                    <cfg.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-txt-primary">{cfg.title}</h3>
                    <p className="text-xs text-txt-muted font-mono">{cfg.varName}</p>
                  </div>
                </div>
                <Badge variant="default">{cfg.status}</Badge>
              </div>

              <p className="text-xs text-txt-secondary leading-relaxed">{cfg.description}</p>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-txt-muted text-[11px]">Configure in `.env.local`</span>
                <a
                  href={cfg.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent hover:underline"
                >
                  Get API Key
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
