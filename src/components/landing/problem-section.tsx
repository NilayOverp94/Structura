'use client';

import { motion } from 'framer-motion';
import { Clock, FolderTree, HelpCircle, GitPullRequest } from 'lucide-react';
import { notionEase } from '@/lib/animations/motion';

const problems = [
  {
    icon: FolderTree,
    title: 'Complex project structures',
    description: 'Large repositories have hundreds of files across deeply nested directories. Finding the right file feels like searching without a map.',
  },
  {
    icon: HelpCircle,
    title: 'No context on architecture',
    description: 'README files rarely explain how components connect, where to find specific functionality, or why design decisions were made.',
  },
  {
    icon: Clock,
    title: 'Hours of manual exploration',
    description: 'Developers spend hours tracing imports, reading unfamiliar code, and trying to understand file relationships before they can contribute.',
  },
  {
    icon: GitPullRequest,
    title: 'High contribution barriers',
    description: 'The time required to understand a new codebase discourages potential open-source contributors, especially beginners.',
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 sm:py-28 border-t border-border bg-surface-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: notionEase }}
          className="text-center mb-14"
        >
          <p className="section-label mb-3">The Problem</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-txt-primary mb-4">
            Understanding unfamiliar code is hard
          </h2>
          <p className="text-txt-secondary max-w-2xl mx-auto">
            Every developer has faced the challenge of joining a project with no context. The onboarding experience for most repositories is inadequate.
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
              transition: { staggerChildren: 0.08 },
            },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto"
        >
          {problems.map((problem) => (
            <motion.div 
              key={problem.title} 
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: notionEase } },
              }}
              whileHover={{ y: -3, scale: 1.01, transition: { duration: 0.18, ease: notionEase } }}
              className="flex gap-4 p-5 rounded-xl border border-border bg-surface-secondary hover:border-zinc-500/80 transition-colors shadow-sm"
            >
              <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-surface-tertiary border border-border flex items-center justify-center">
                <problem.icon className="h-4.5 w-4.5 text-txt-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-txt-primary mb-1">{problem.title}</h3>
                <p className="text-sm text-txt-secondary leading-relaxed">{problem.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
