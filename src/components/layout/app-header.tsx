'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { StructuraLogo } from '@/components/brand/structura-logo';
import { createClient } from '@/lib/supabase/client';
import { getUserPreferences } from '@/lib/settings/user-settings';
import { useState, useEffect, useRef } from 'react';

interface AppHeaderProps {
  userEmail?: string | null;
}

export function AppHeader({ userEmail }: AppHeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState<string>('');
  const [profileEmail, setProfileEmail] = useState<string>('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const prefs = getUserPreferences();
      if (prefs.displayName && prefs.displayName !== 'Developer') {
        setProfileName(prefs.displayName);
      }

      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const emailVal = user.email || '';
          setProfileEmail(emailVal);
          const metaName = user.user_metadata?.username || user.user_metadata?.display_name || user.user_metadata?.name;
          if (metaName) {
            setProfileName(metaName);
          } else if (emailVal) {
            setProfileName(emailVal.split('@')[0]);
          }
        }
      }).catch(() => {});
    } catch {}
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    window.location.href = '/login';
  };

  const displayName = profileName || userEmail || profileEmail || 'Developer';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'N';

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

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="User Account Menu"
            title={`Signed in as ${displayName}`}
            className="flex items-center gap-2 p-1 rounded-lg border border-border hover:bg-surface-secondary transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-100 flex items-center justify-center text-xs font-bold shadow-sm">
              {initial}
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-surface-secondary shadow-2xl py-1 text-xs text-txt-secondary z-50 animate-slide-down">
              <div className="px-3.5 py-2.5 border-b border-border">
                <p className="font-semibold text-txt-primary truncate capitalize">{displayName}</p>
                <p className="text-[11px] text-txt-muted truncate">{profileEmail || userEmail || 'Active Session'}</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-txt-secondary hover:bg-surface-tertiary hover:text-txt-primary transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings & Preferences
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleSignOut();
                }}
                className="flex items-center gap-2.5 w-full text-left px-3.5 py-2 text-status-error hover:bg-surface-tertiary transition-colors"
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
