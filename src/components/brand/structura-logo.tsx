'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';

interface LogoMarkProps {
  className?: string;
  size?: number;
}

/**
 * 3D Isometric Hexagonal "S" Mark matching the official Structura brand design.
 * Features two stacked isometric ribbon tiers with cyan-to-blue (#3B82F6)
 * and blue-to-violet (#8B5CF6) multi-stop gradients.
 */
export function StructuraMark({ className, size = 36 }: LogoMarkProps) {
  const idPrefix = React.useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('flex-shrink-0', className)}
    >
      <defs>
        {/* Top Tier Gradients */}
        <linearGradient id={`${idPrefix}-topFace`} x1="20" y1="10" x2="80" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-topRight`} x1="60" y1="20" x2="85" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-topInner`} x1="30" y1="30" x2="70" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>

        {/* Bottom Tier Gradients */}
        <linearGradient id={`${idPrefix}-botFace`} x1="15" y1="45" x2="75" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-botRight`} x1="50" y1="55" x2="85" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-botLeft`} x1="15" y1="50" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        {/* Soft Drop Glow */}
        <filter id={`${idPrefix}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#3B82F6" floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter={`url(#${idPrefix}-glow)`}>
        {/* --- TOP TIER OF "S" --- */}
        {/* Top Hex Face */}
        <path
          d="M 50 12 L 82 30.5 L 68 38.5 L 50 28 L 32 38.5 L 18 30.5 Z"
          fill={`url(#${idPrefix}-topFace)`}
        />
        {/* Top Right Downward Flange */}
        <path
          d="M 82 30.5 L 82 46 L 68 54 L 68 38.5 Z"
          fill={`url(#${idPrefix}-topRight)`}
        />
        {/* Top Inward Horizontal Ribbon (Crossing right-to-left) */}
        <path
          d="M 82 46 L 68 54 L 38 37 L 52 29 Z"
          fill={`url(#${idPrefix}-topInner)`}
        />
        {/* Top Left Vertical Flange */}
        <path
          d="M 18 30.5 L 32 38.5 L 32 50 L 18 42 Z"
          fill={`url(#${idPrefix}-topFace)`}
        />

        {/* --- BOTTOM TIER OF "S" --- */}
        {/* Bottom Central Crossing Ribbon (Left-to-right) */}
        <path
          d="M 18 52 L 48 69 L 62 61 L 32 44 Z"
          fill={`url(#${idPrefix}-botFace)`}
        />
        {/* Bottom Left Downward Flange */}
        <path
          d="M 18 52 L 18 68 L 32 76 L 32 60 Z"
          fill={`url(#${idPrefix}-botLeft)`}
        />
        {/* Bottom Hex Base */}
        <path
          d="M 18 68 L 50 86.5 L 64 78.5 L 32 60 Z"
          fill={`url(#${idPrefix}-botLeft)`}
        />
        {/* Bottom Right Upward Flange */}
        <path
          d="M 50 86.5 L 82 68 L 82 56 L 68 64 L 50 74.5 Z"
          fill={`url(#${idPrefix}-botRight)`}
        />
      </g>
    </svg>
  );
}

interface StructuraLogoProps {
  variant?: 'full' | 'wordmark' | 'icon' | 'app-icon-dark' | 'app-icon-light' | 'favicon';
  theme?: 'dark' | 'light' | 'auto';
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function StructuraLogo({
  variant = 'full',
  theme = 'auto',
  showTagline = true,
  size = 'md',
  className,
}: StructuraLogoProps) {
  const { resolvedTheme } = useTheme();
  const isDark = theme === 'auto' ? resolvedTheme === 'dark' : theme === 'dark';

  const markSizes = {
    sm: 28,
    md: 36,
    lg: 48,
    xl: 64,
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const taglineSizes = {
    sm: 'text-[7px] tracking-[0.25em]',
    md: 'text-[8.5px] tracking-[0.3em]',
    lg: 'text-[10px] tracking-[0.32em]',
    xl: 'text-[12px] tracking-[0.35em]',
  };

  // App Icon (Dark) - from picture
  if (variant === 'app-icon-dark') {
    return (
      <div className={cn('relative flex items-center justify-center rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-xl p-3', className)}>
        <StructuraMark size={markSizes[size] * 1.2} />
      </div>
    );
  }

  // App Icon (Light) - from picture
  if (variant === 'app-icon-light') {
    return (
      <div className={cn('relative flex items-center justify-center rounded-2xl bg-white border border-[#E2E8F0] shadow-xl shadow-slate-200/50 p-3', className)}>
        <StructuraMark size={markSizes[size] * 1.2} />
      </div>
    );
  }

  // Favicon - from picture
  if (variant === 'favicon') {
    return (
      <div className={cn('relative flex items-center justify-center rounded-xl bg-[#0F172A] border border-[#334155] p-2', className)}>
        <StructuraMark size={markSizes[size]} />
      </div>
    );
  }

  // Icon only
  if (variant === 'icon') {
    return <StructuraMark size={markSizes[size]} className={className} />;
  }

  // Wordmark only (No Tagline) - from picture
  if (variant === 'wordmark') {
    return (
      <div className={cn('font-sans font-bold tracking-tight', textSizes[size], isDark ? 'text-white' : 'text-[#0F172A]', className)}>
        Structura
      </div>
    );
  }

  // Full Logo with wordmark and optional tagline
  return (
    <div className={cn('inline-flex items-center gap-3 group select-none', className)}>
      <StructuraMark size={markSizes[size]} />
      <div className="flex flex-col justify-center">
        <span
          className={cn(
            'font-sans font-bold tracking-tight leading-none',
            textSizes[size],
            isDark ? 'text-white' : 'text-[#0F172A]'
          )}
        >
          Structura
        </span>
        {showTagline && (
          <span
            className={cn(
              'font-mono uppercase font-semibold leading-tight mt-1 text-[#64748B]',
              taglineSizes[size]
            )}
          >
            UNDERSTAND ANY CODEBASE
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Brand Showcase Component that renders the complete brand sheet from the user's reference image:
 * - Full Dark Theme Banner
 * - Full Light Theme Banner
 * - App Icon (Dark)
 * - App Icon (Light)
 * - Favicon
 * - Wordmark (No Tagline)
 * - Color Palette Swatches with exact hex codes
 */
export function StructuraBrandSheet() {
  const colors = [
    { name: 'Primary', hex: '#3B82F6', text: 'white' },
    { name: 'Secondary', hex: '#8B5CF6', text: 'white' },
    { name: 'Background', hex: '#0F172A', text: 'white' },
    { name: 'Text', hex: '#64748B', text: 'white' },
    { name: 'Border/Elements', hex: '#E2E8F0', text: '#0F172A' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Light Version Banner */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm flex items-center justify-center min-h-[160px]">
          <StructuraLogo theme="light" size="lg" />
        </div>

        {/* Dark Version Banner */}
        <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-8 shadow-xl flex items-center justify-center min-h-[160px]">
          <StructuraLogo theme="dark" size="lg" />
        </div>
      </div>

      {/* Asset Icons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* App Icon (Dark) */}
        <div className="card p-4 flex flex-col items-center justify-center text-center space-y-2">
          <StructuraLogo variant="app-icon-dark" size="md" />
          <span className="text-[11px] font-mono text-txt-muted">App Icon (Dark)</span>
        </div>

        {/* App Icon (Light) */}
        <div className="card p-4 flex flex-col items-center justify-center text-center space-y-2">
          <StructuraLogo variant="app-icon-light" size="md" />
          <span className="text-[11px] font-mono text-txt-muted">App Icon (Light)</span>
        </div>

        {/* Favicon */}
        <div className="card p-4 flex flex-col items-center justify-center text-center space-y-2">
          <StructuraLogo variant="favicon" size="sm" />
          <span className="text-[11px] font-mono text-txt-muted">Favicon</span>
        </div>

        {/* Wordmark (No Tagline) */}
        <div className="card p-4 flex flex-col items-center justify-center text-center space-y-2">
          <div className="py-2">
            <StructuraLogo variant="wordmark" size="md" />
          </div>
          <span className="text-[11px] font-mono text-txt-muted">Wordmark (No Tagline)</span>
        </div>
      </div>

      {/* Brand Colors Swatches */}
      <div className="card p-5 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-txt-muted font-mono">
          Brand Colors
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {colors.map((c) => (
            <div key={c.name} className="space-y-1.5">
              <div
                className="h-12 rounded-xl flex items-center justify-center font-mono text-xs font-bold shadow-inner border border-black/10"
                style={{ backgroundColor: c.hex, color: c.text }}
              >
                {c.hex}
              </div>
              <div className="text-[11px]">
                <p className="font-medium text-txt-primary">{c.name}</p>
                <p className="text-[10px] font-mono text-txt-muted">{c.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

