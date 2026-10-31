'use client';

import { motion } from 'framer-motion';
import { 
  Network, FileCode2, GitFork, MessageSquare, 
  Map, Bug
} from 'lucide-react';
import { notionEase } from '@/lib/animations/motion';

const features = [
  {
    icon: Network,
    title: 'Architecture Explorer',
    description: 'Interactive dependency graph that maps how components connect. Visualize the entire architecture with node details, zoom, and filtering.',
  },
  {
    icon: FileCode2,
    title: 'File Intelligence',
    description: 'AI-generated explanations for every file. Understand what each file does, why it exists, its key functions, and how it relates to the codebase.',
  },
  {
    icon: GitFork,
    title: 'Dependency Mapping',
    description: 'Detect frameworks, libraries, and internal module relationships. See declared versions, categories, and where each dependency is used.',
  },
  {
    icon: MessageSquare,
    title: 'Ask Your Codebase',
    description: 'RAG-powered chat that answers questions using actual repository code. Get grounded responses with source citations and file references.',
  },
  {
    icon: Map,
    title: 'Contributor Roadmap',
    description: 'AI-generated learning path tailored to the repository. Step-by-step onboarding from understanding the project to making your first contribution.',
  },
  {
    icon: Bug,
    title: 'Bug & Feature Locator',
    description: 'Describe a feature to implement or a bug to investigate. Get ranked relevant files, important functions, and suggested inspection order.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: notionEase }}
          className="text-center mb-14"
        >
          <p className="section-label mb-3">Capabilities</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-txt-primary mb-4">
            Everything you need to navigate unfamiliar code
          </h2>
          <p className="text-txt-secondary max-w-2xl mx-auto">
            From high-level architecture to individual line explanations, Structura gives you the tools to understand any repository.
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
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { 
                  opacity: 1, 
                  y: 0,
                  transition: { duration: 0.35, ease: notionEase }
                },
              }}
              whileHover={{ 
                y: -4, 
                transition: { duration: 0.18, ease: notionEase } 
              }}
              className="group rounded-xl border border-border bg-surface-secondary p-6 transition-colors hover:border-border-light hover:bg-surface-tertiary cursor-default"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 mb-4 transition-colors">
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-txt-primary mb-2">{feature.title}</h3>
              <p className="text-sm text-txt-secondary leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
