'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { StructuraLogo } from '@/components/brand/structura-logo';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

interface AppHeaderProps {
  userEmail?: string | null;
}

export function AppHeader({ userEmail }: AppHeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-surface-primary/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <StructuraLogo size="sm" showTagline={false} />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/dashboard"
            className="px-3 py-1.5 text-xs font-medium text-txt-secondary hover:text-txt-primary hover:bg-surface-secondary rounded-md transition-colors"
          >
            Repositories
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle size="sm" />

        <Link href="/analyze">
          <Button size="sm" variant="primary" className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Analyze Repo
          </Button>
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg border border-border hover:bg-surface-secondary text-txt-secondary hover:text-txt-primary transition-colors"
          >
            <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-xs font-medium text-txt-primary">
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-surface-secondary shadow-xl py-1 text-xs text-txt-secondary z-50">
              <div className="px-3 py-2 border-b border-border">
                <p className="font-medium text-txt-primary truncate">{userEmail || 'Developer'}</p>
                <p className="text-[10px] text-txt-muted truncate">Active Session</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-surface-tertiary hover:text-txt-primary"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleSignOut();
                }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-status-error hover:bg-surface-tertiary"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
