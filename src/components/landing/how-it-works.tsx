'use client';

import { motion } from 'framer-motion';
import { GitBranch, Cpu, Network, MessageSquare, Rocket } from 'lucide-react';
import { notionEase } from '@/lib/animations/motion';

const steps = [
  {
    icon: GitBranch,
    step: '01',
    title: 'Paste a Repository URL',
    description: 'Enter any public GitHub repository URL. No installation, no tokens needed for public repositories.',
  },
  {
    icon: Cpu,
    step: '02',
    title: 'AI Analyzes the Repository',
    description: 'We fetch the source code, detect technologies, map dependencies, and generate embeddings for semantic search.',
  },
  {
    icon: Network,
    step: '03',
    title: 'Explore Architecture',
    description: 'View an interactive graph of the codebase. Understand how components connect, which files matter most, and where to start.',
  },
  {
    icon: MessageSquare,
    step: '04',
    title: 'Ask Questions',
    description: 'Chat with the codebase using natural language. Get answers grounded in actual source code with file citations.',
  },
  {
    icon: Rocket,
    step: '05',
    title: 'Start Contributing',
    description: 'Follow the AI-generated learning path, locate relevant files for your task, and make your first contribution with confidence.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 border-t border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: notionEase }}
          className="text-center mb-14"
        >
          <p className="section-label mb-3">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-txt-primary mb-4">
            From URL to understanding in minutes
          </h2>
          <p className="text-txt-secondary max-w-xl mx-auto">
            Five steps to go from knowing nothing about a project to being ready to contribute.
          </p>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
          className="relative space-y-0"
        >
          {/* Animated vertical connecting line */}
          <div className="absolute left-6 top-8 bottom-8 w-px bg-border hidden md:block" />

          {steps.map((step) => (
            <motion.div 
              key={step.step}
              variants={{
                hidden: { opacity: 0, x: -16 },
                show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: notionEase } },
              }}
              whileHover={{ x: 4, transition: { duration: 0.15 } }}
              className="relative flex items-start gap-6 py-6 group"
            >
              <motion.div 
                whileHover={{ scale: 1.1, rotate: [0, -6, 6, 0] }}
                transition={{ duration: 0.25 }}
                className="relative flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl border border-border bg-surface-secondary group-hover:border-zinc-500 group-hover:bg-surface-tertiary transition-colors z-10 shadow-sm"
              >
                <step.icon className="h-5 w-5 text-txt-primary" />
              </motion.div>
              <div className="pt-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xs text-txt-muted group-hover:text-txt-primary font-semibold transition-colors">
                    {step.step}
                  </span>
                  <h3 className="text-base font-semibold text-txt-primary">{step.title}</h3>
                </div>
                <p className="text-sm text-txt-secondary leading-relaxed max-w-lg">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
