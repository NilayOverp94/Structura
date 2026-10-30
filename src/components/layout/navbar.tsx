'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Palette } from 'lucide-react';
import { StructuraLogo, StructuraBrandSheet } from '@/components/brand/structura-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Modal } from '@/components/ui/modal';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#product', label: 'Product' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-surface-primary/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <StructuraLogo size="sm" showTagline={true} />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm text-txt-secondary hover:text-txt-primary transition-colors rounded-md font-medium"
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => setBrandModalOpen(true)}
              className="px-3 py-2 text-sm text-txt-secondary hover:text-txt-primary transition-colors rounded-md font-medium flex items-center gap-1.5"
            >
              <Palette className="h-3.5 w-3.5 text-brand-secondary" />
              Brand Identity
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle size="sm" />
            <Link href="/login" className="btn-ghost text-sm">
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              Get Started
            </Link>
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

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface-primary animate-slide-down">
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
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setBrandModalOpen(true);
                }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-txt-secondary hover:text-txt-primary rounded-md"
              >
                <Palette className="h-3.5 w-3.5 text-brand-secondary" />
                Brand Identity
              </button>
              <div className="pt-4 border-t border-border flex flex-col gap-2">
                <Link href="/login" className="btn-ghost text-sm justify-center">
                  Sign in
                </Link>
                <Link href="/signup" className="btn-primary text-sm justify-center">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Brand Identity Guide Modal (Showcases all items from picture) */}
      <Modal
        open={brandModalOpen}
        onClose={() => setBrandModalOpen(false)}
        title="Structura Brand Guidelines & Identity Kit"
        className="max-w-2xl max-h-[85vh] overflow-y-auto"
      >
        <p className="text-xs text-txt-secondary mb-4">
          Official visual identity assets for Structura. Includes dark & light variants, app icons, favicons, wordmark, and core color tokens.
        </p>
        <StructuraBrandSheet />
      </Modal>
    </>
  );
}
