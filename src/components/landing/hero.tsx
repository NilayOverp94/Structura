'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GitBranch, Search, Sparkles, Network, Code2, Database, Bot, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseGitHubUrl } from '@/lib/validation/github-url';
import { StructuraMark } from '@/components/brand/structura-logo';
import { notionEase, notionSpring } from '@/lib/animations/motion';

export function Hero() {
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const sampleRepos = [
    'facebook/react',
    'vercel/next.js',
    'supabase/supabase',
  ];

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

  const handleSelectSample = (sample: string) => {
    const full = `https://github.com/${sample}`;
    setRepoUrl(full);
    setError('');
  };

  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
      {/* Subtle monochrome atmospheric illumination and grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      
      {/* Animated glowing ambient aura */}
      <motion.div 
        animate={{ 
          scale: [1, 1.12, 1],
          opacity: [0.3, 0.55, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-10 left-1/2 -translate-x-1/2 w-[650px] h-[340px] bg-white/[0.04] dark:bg-white/[0.05] rounded-full blur-3xl pointer-events-none" 
      />
      
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Brand pill */}
        <motion.div 
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03, transition: notionSpring }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-secondary/80 backdrop-blur-sm px-3.5 py-1.5 text-xs text-txt-secondary mb-8 shadow-sm cursor-default"
        >
          <StructuraMark size={16} />
          <span className="font-semibold text-txt-primary">Structura</span>
          <span className="text-txt-muted">•</span>
          <span className="font-mono text-[10px] tracking-wider uppercase text-txt-muted font-semibold">Understand Any Codebase</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, delay: 0.08, ease: notionEase }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-txt-primary leading-[1.1] mb-6"
        >
          Understand Any Codebase.{' '}
          <br className="hidden sm:block" />
          <span className="text-txt-primary bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500">
            Start Contributing
          </span>{' '}
          <br className="hidden sm:block" />
          With Confidence.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, delay: 0.16, ease: notionEase }}
          className="text-base sm:text-lg text-txt-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Explore unfamiliar software architectures, trace dependencies, and discover exactly where to start — powered by AI grounded in real code.
        </motion.p>

        {/* Input Form with sleek animated focus & hover */}
        <motion.form 
          initial={{ opacity: 0, scale: 0.98, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.22, ease: notionEase }}
          onSubmit={handleSubmit} 
          className="relative max-w-xl mx-auto mb-5"
        >
          <div className="relative group rounded-xl p-[1px] bg-gradient-to-r from-zinc-700/40 via-zinc-400/40 to-zinc-700/40 hover:from-zinc-500/60 hover:to-zinc-500/60 transition-all duration-300 shadow-xl shadow-black/20">
            <div className="flex items-center rounded-xl bg-surface-secondary/95 backdrop-blur px-2 py-1.5 focus-within:ring-1 focus-within:ring-zinc-400">
              <GitBranch className="ml-2.5 h-4 w-4 text-txt-muted flex-shrink-0" />
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => { setRepoUrl(e.target.value); setError(''); }}
                placeholder="https://github.com/owner/repository"
                className="flex-1 bg-transparent px-3 py-2 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none font-mono"
              />
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button type="submit" size="md" className="flex-shrink-0">
                  <Search className="h-4 w-4" />
                  Analyze
                </Button>
              </motion.div>
            </div>
          </div>
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-6 left-0 text-xs text-status-error"
            >
              {error}
            </motion.p>
          )}
        </motion.form>

        {/* Quick Sample Selector Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center justify-center gap-2 mb-10 flex-wrap"
        >
          <span className="text-[11px] text-txt-muted font-mono">Try sample:</span>
          {sampleRepos.map((sample) => (
            <motion.button
              key={sample}
              type="button"
              onClick={() => handleSelectSample(sample)}
              whileHover={{ y: -1, scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-surface-secondary border border-border text-txt-secondary hover:text-txt-primary hover:border-zinc-500 transition-colors"
            >
              {sample}
            </motion.button>
          ))}
        </motion.div>

        {/* Interactive Floating Live Radar Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.35, ease: notionEase }}
          className="relative max-w-2xl mx-auto rounded-xl border border-border bg-surface-secondary/70 backdrop-blur-md p-4 shadow-2xl overflow-hidden"
        >
          {/* Subtle scanning laser bar */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-400/50 to-transparent" />

          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono text-txt-muted text-[11px]">LIVE ARCHITECTURE SCANNER</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">AST • AST-3 • GEMINI 3.5</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
            {[
              { icon: Code2, label: 'Client UI', sub: 'Components & Router', files: '32 files' },
              { icon: Network, label: 'API Endpoints', sub: 'Edge Serverless', files: '14 routes' },
              { icon: Database, label: 'Data Layer', sub: 'pgvector & SQL', files: '8 schemas' },
              { icon: Bot, label: 'AI Agent RAG', sub: 'Gemini 3.5 Grounding', files: 'Full Graph' },
            ].map((node, i) => (
              <motion.div
                key={node.label}
                whileHover={{ y: -3, scale: 1.02 }}
                transition={{ duration: 0.18 }}
                className="p-3 rounded-lg border border-border bg-surface-primary/80 flex flex-col justify-between group cursor-default"
              >
                <div>
                  <node.icon className="h-4 w-4 text-txt-primary mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-semibold text-txt-primary">{node.label}</p>
                  <p className="text-[10px] text-txt-muted mt-0.5 truncate">{node.sub}</p>
                </div>
                <span className="text-[9px] font-mono text-txt-muted mt-2 pt-1 border-t border-border/40">
                  {node.files}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="text-xs text-txt-muted mt-8"
        >
          Analyze public GitHub repositories without installing anything. Powered by Google Gemini & pgvector.
        </motion.p>
      </div>
    </section>
  );
}
