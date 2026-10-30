'use client';

import { useTheme } from '@/components/theme-provider';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function ThemeToggle({ className, size = 'md' }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle theme mode"
      title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      className={cn(
        'relative inline-flex items-center justify-center rounded-lg border border-border bg-surface-secondary text-txt-secondary hover:text-txt-primary hover:bg-surface-tertiary transition-colors',
        size === 'sm' ? 'w-8 h-8 p-1.5' : 'w-9 h-9 p-2',
        className
      )}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4 text-[#F59E0B] transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-[#3B82F6] transition-transform duration-200" />
      )}
    </button>
  );
}

