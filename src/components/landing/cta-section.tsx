'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { notionEase, notionSpring } from '@/lib/animations/motion';

export function CTASection() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-border overflow-hidden">
      {/* Subtle ambient lighting */}
      <motion.div 
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[280px] bg-white/[0.03] dark:bg-white/[0.04] rounded-full blur-3xl pointer-events-none" 
      />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: notionEase }}
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-secondary px-3 py-1 text-xs text-txt-muted mb-6">
            <Sparkles className="h-3 w-3 text-txt-primary" />
            <span>Ready in under 60 seconds</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-txt-primary tracking-tight mb-5 leading-tight">
            Your next open-source contribution starts here.
          </h2>

          <p className="text-base sm:text-lg text-txt-secondary mb-10 max-w-xl mx-auto leading-relaxed">
            Stop spending hours figuring out unfamiliar codebases. Let AI guide you through any repository with grounded source citations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/signup" className="btn-primary text-sm sm:text-base px-8 py-3 shadow-lg shadow-black/20 flex items-center gap-2">
                Get Started — Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/login" className="btn-secondary text-sm sm:text-base px-8 py-3">
                Sign In
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
