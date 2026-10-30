import { StructuraBrandSheet } from '@/components/brand/structura-logo';
import { Palette } from 'lucide-react';

export function BrandSection() {
  return (
    <section className="py-20 sm:py-24 border-t border-border bg-surface-secondary/40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-secondary px-3 py-1 text-xs text-txt-secondary mb-4">
            <Palette className="h-3.5 w-3.5 text-brand-secondary" />
            Visual Identity System
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-txt-primary tracking-tight">
            Designed for Clarity. Built for Developers.
          </h2>
          <p className="text-sm text-txt-secondary max-w-xl mx-auto mt-2">
            The official Structura design system combines 3D geometric isometric architecture with dark & light theme modes.
          </p>
        </div>

        <StructuraBrandSheet />
      </div>
    </section>
  );
}

