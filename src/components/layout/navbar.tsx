'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { StructuraLogo } from '@/components/brand/structura-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { notionEase, notionSpring, notionTransition } from '@/lib/animations/motion';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#product', label: 'Product' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-surface-primary/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <Link href="/" className="flex items-center gap-2.5 group">
          <StructuraLogo size="sm" showTagline={true} />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              whileHover={{ y: -1 }}
              transition={{ duration: 0.15 }}
              className="px-3 py-2 text-sm text-txt-secondary hover:text-txt-primary transition-colors rounded-md font-medium"
            >
              {link.label}
            </motion.a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle size="sm" />
          <Link href="/login" className="btn-ghost text-sm">
            Sign In
          </Link>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link href="/signup" className="btn-primary text-sm shadow-sm">
              Get Started
            </Link>
          </motion.div>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle size="sm" />
          <button
            className="p-2 text-txt-secondary hover:text-txt-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={notionTransition}
            className="md:hidden border-t border-border bg-surface-primary overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-sm text-txt-secondary hover:text-txt-primary rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-border flex flex-col gap-2">
                <Link href="/login" className="btn-ghost text-sm justify-center">
                  Sign in
                </Link>
                <Link href="/signup" className="btn-primary text-sm justify-center">
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
