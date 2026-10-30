'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitBranch, Sparkles, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseGitHubUrl } from '@/lib/validation/github-url';
import { StructuraMark } from '@/components/brand/structura-logo';

export function Hero() {
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!repoUrl.trim()) {
      setError('Please enter a repository URL');
      return;
    }

    const parsed = parseGitHubUrl(repoUrl.trim());
    if (!parsed) {
      setError('Enter a valid GitHub URL (e.g., https://github.com/owner/repo)');
      return;
    }

    router.push(`/analyze?url=${encodeURIComponent(repoUrl.trim())}`);
  };

  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Subtle brand glow and grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:50px_50px]" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#3B82F6]/15 via-[#8B5CF6]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Brand pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-secondary px-3.5 py-1.5 text-xs text-txt-secondary mb-8 shadow-sm">
          <StructuraMark size={16} />
          <span className="font-semibold text-txt-primary">Structura</span>
          <span className="text-txt-muted">•</span>
          <span className="font-mono text-[10px] tracking-wider uppercase text-brand-secondary font-semibold">Understand Any Codebase</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-txt-primary leading-[1.1] mb-6">
          Understand Any Codebase.{' '}
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">
            Start Contributing
          </span>{' '}
          <br className="hidden sm:block" />
          With Confidence.
        </h1>

        <p className="text-base sm:text-lg text-txt-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
          Explore unfamiliar software architectures, trace dependencies, and discover exactly where to start — powered by AI grounded in real code.
        </p>

        <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto mb-4">
          <div className="flex items-center rounded-xl border border-border bg-surface-secondary p-1.5 focus-within:border-accent shadow-lg shadow-black/5 transition-all">
            <GitBranch className="ml-3 h-4 w-4 text-txt-muted flex-shrink-0" />
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => { setRepoUrl(e.target.value); setError(''); }}
              placeholder="https://github.com/owner/repository"
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none font-mono"
            />
            <Button type="submit" size="md" className="flex-shrink-0">
              <Search className="h-4 w-4" />
              Analyze
            </Button>
          </div>
          {error && (
            <p className="absolute -bottom-6 left-0 text-xs text-status-error">{error}</p>
          )}
        </form>

        <p className="text-xs text-txt-muted mt-8">
          Analyze public GitHub repositories without installing anything. Powered by Google Gemini & pgvector.
        </p>
      </div>
    </section>
  );
}
