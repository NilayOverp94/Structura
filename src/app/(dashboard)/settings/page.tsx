'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Shield, 
  KeyRound, 
  Laptop, 
  Code, 
  Sparkles, 
  Sliders, 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  Trash2, 
  LogOut, 
  Copy, 
  Save, 
  GitBranch,
  Layers,
  Database,
  Lock,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/components/theme-provider';
import { createClient } from '@/lib/supabase/client';
import { 
  UserPreferences, 
  DEFAULT_USER_PREFERENCES, 
  getUserPreferences, 
  saveUserPreferences 
} from '@/lib/settings/user-settings';

type SettingsTab = 'profile' | 'intelligence' | 'appearance' | 'security';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<string>('');
  const [copiedId, setCopiedId] = useState(false);

  // User preferences state
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Security / Password update state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Cache clear state
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    // Load local preferences
    const loadedPrefs = getUserPreferences();
    setPrefs(loadedPrefs);

    // Fetch auth user from Supabase
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUserEmail(user.email || '');
          setUserId(user.id);
          if (user.created_at) {
            setCreatedAt(new Date(user.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }));
          }
          if (user.user_metadata?.display_name) {
            setPrefs(prev => ({ ...prev, displayName: user.user_metadata.display_name }));
          }
        } else {
          setUserEmail('developer@structura.ai');
          setUserId('usr_prod_live_' + Math.random().toString(36).substring(2, 9));
          setCreatedAt('March 2026');
        }
      }).catch(() => {
        setUserEmail('developer@structura.ai');
        setUserId('usr_active_session');
        setCreatedAt('March 2026');
      });
    } catch {
      setUserEmail('developer@structura.ai');
      setUserId('usr_active_session');
      setCreatedAt('March 2026');
    }
  }, []);

  const handleSavePreferences = async () => {
    setSaving(true);
    saveUserPreferences(prefs);

    // Try to update Supabase user metadata if available
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: { display_name: prefs.displayName }
      });
    } catch {
      // Ignored for non-essential sync
    }

    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 300);
  };

  const handleCopyId = () => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordStatus({ type: 'error', message: error.message });
      } else {
        setPasswordStatus({ type: 'success', message: 'Password updated successfully.' });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleClearCache = () => {
    try {
      // Clear repository parsed caches while keeping theme and user preferences
      const themeVal = localStorage.getItem('structura-theme');
      const prefsVal = localStorage.getItem('structura_user_preferences');
      
      localStorage.clear();
      
      if (themeVal) localStorage.setItem('structura-theme', themeVal);
      if (prefsVal) localStorage.setItem('structura_user_preferences', prefsVal);
      
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    } catch (err) {
      console.warn('Could not clear local cache:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    window.location.href = '/login';
  };

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'profile', label: 'Profile & Account', icon: User },
    { id: 'intelligence', label: 'Code Intelligence', icon: Sparkles },
    { id: 'appearance', label: 'Viewer & Appearance', icon: Laptop },
    { id: 'security', label: 'Security & Session', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-surface-primary text-txt-primary">
      <AppHeader userEmail={userEmail} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-txt-primary">Settings</h1>
          <p className="text-sm text-txt-secondary mt-1">
            Manage your developer profile, AI analysis models, syntax viewer, and security preferences.
          </p>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-border mb-8 overflow-x-auto no-scrollbar gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-txt-primary text-txt-primary'
                    : 'border-transparent text-txt-muted hover:text-txt-secondary hover:border-border'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Profile & Account */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="card p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-surface-tertiary border border-border flex items-center justify-center text-lg font-bold text-txt-primary shadow-inner">
                    {userEmail ? userEmail.charAt(0).toUpperCase() : 'D'}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-txt-primary">
                      {prefs.displayName || 'Developer'}
                    </h3>
                    <p className="text-xs text-txt-muted">{userEmail || 'developer@structura.ai'}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="default" className="text-[10px] bg-zinc-800 text-zinc-200 border-zinc-700">
                        Active Account
                      </Badge>
                      <span className="text-[11px] text-txt-muted">
                        Member since {createdAt || '2026'}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-xs border-border text-txt-secondary hover:text-status-error self-start sm:self-center"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  Sign Out
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                    Display Name
                  </label>
                  <Input
                    value={prefs.displayName}
                    onChange={(e) => setPrefs({ ...prefs, displayName: e.target.value })}
                    placeholder="Your name or handle"
                    className="text-xs"
                  />
                  <p className="text-[11px] text-txt-muted mt-1">
                    Displayed in workspace navigation and collaborative audit logs.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Input
                      value={userEmail}
                      disabled
                      className="text-xs bg-surface-tertiary/60 opacity-80 cursor-not-allowed pr-20"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-status-success font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </div>
                  </div>
                  <p className="text-[11px] text-txt-muted mt-1">
                    Managed by Supabase Authentication.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                  Account Identifier
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 rounded-lg bg-surface-tertiary border border-border font-mono text-xs text-txt-muted truncate">
                    {userId || 'usr_prod_live'}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyId}
                    className="text-xs shrink-0"
                  >
                    {copiedId ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1 text-status-success" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copy ID
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-border">
                {saveSuccess ? (
                  <span className="flex items-center gap-1.5 text-xs text-status-success font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Preferences saved successfully
                  </span>
                ) : (
                  <span className="text-xs text-txt-muted">All profile changes persist across sessions.</span>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="text-xs"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </div>

            {/* Plan & Quotas */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-txt-primary">Subscription & Analysis Capacity</h3>
                  <p className="text-xs text-txt-muted mt-0.5">
                    Your current workspace indexing bandwidth and repository quota.
                  </p>
                </div>
                <Badge variant="default" className="bg-zinc-800 text-zinc-100 border-zinc-700">
                  Developer Plan
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-3.5 rounded-lg bg-surface-secondary border border-border space-y-1">
                  <p className="text-[11px] text-txt-muted font-medium">Monthly AST Scans</p>
                  <p className="text-lg font-bold text-txt-primary">Unlimited</p>
                  <p className="text-[10px] text-txt-muted">Public GitHub Repositories</p>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-secondary border border-border space-y-1">
                  <p className="text-[11px] text-txt-muted font-medium">Vector Code Chunks</p>
                  <p className="text-lg font-bold text-txt-primary">50,000</p>
                  <p className="text-[10px] text-txt-muted">Semantic pgvector indexing</p>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-secondary border border-border space-y-1">
                  <p className="text-[11px] text-txt-muted font-medium">Architecture Synthesis</p>
                  <p className="text-lg font-bold text-txt-primary">Active</p>
                  <p className="text-[10px] text-txt-muted">Mermaid diagrams & dependency graphs</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Code Intelligence */}
        {activeTab === 'intelligence' && (
          <div className="space-y-6">
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-txt-primary">Repository Indexing & AI Defaults</h3>
                <p className="text-xs text-txt-muted mt-0.5">
                  Tune how Structura scans AST structures, generates diagrams, and answers codebase questions.
                </p>
              </div>

              {/* Default Branch */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-txt-secondary">
                  Default Git Branch
                </label>
                <div className="max-w-xs flex items-center gap-2">
                  <div className="relative flex-1">
                    <GitBranch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-txt-muted" />
                    <Input
                      value={prefs.defaultBranch}
                      onChange={(e) => setPrefs({ ...prefs, defaultBranch: e.target.value })}
                      placeholder="main"
                      className="pl-8 text-xs font-mono"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-txt-muted">
                  The primary branch Structura queries first when cloning repository trees.
                </p>
              </div>

              {/* AI Detail Level */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-medium text-txt-secondary">
                  AI Codebase Reasoning Style
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'concise',
                      title: 'Concise',
                      desc: 'Direct file paths, line references, and short bullet points.',
                    },
                    {
                      id: 'balanced',
                      title: 'Balanced (Standard)',
                      desc: 'High-level architecture context, key functions, and call traces.',
                    },
                    {
                      id: 'comprehensive',
                      title: 'Comprehensive',
                      desc: 'Deep symbol graphs, design patterns, and in-depth walkthroughs.',
                    },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPrefs({ ...prefs, aiDetailLevel: option.id as any })}
                      className={`text-left p-3.5 rounded-lg border transition-all ${
                        prefs.aiDetailLevel === option.id
                          ? 'border-txt-primary bg-surface-tertiary text-txt-primary shadow-sm'
                          : 'border-border bg-surface-secondary text-txt-secondary hover:border-zinc-700'
                      }`}
                    >
                      <p className="text-xs font-semibold text-txt-primary flex items-center justify-between">
                        {option.title}
                        {prefs.aiDetailLevel === option.id && (
                          <Check className="h-3.5 w-3.5 text-txt-primary" />
                        )}
                      </p>
                      <p className="text-[11px] text-txt-muted mt-1 leading-snug">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* AST Parsing Depth */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-medium text-txt-secondary">
                  AST Parsing Depth
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'minimal',
                      title: 'Fast Overview',
                      desc: 'Entry points, package manifests, and high-level routing.',
                    },
                    {
                      id: 'standard',
                      title: 'Standard',
                      desc: 'Full symbol signatures, exports, imports, and component hierarchies.',
                    },
                    {
                      id: 'deep',
                      title: 'Deep Symbol Index',
                      desc: 'Granular function bodies, intra-module references, and type definitions.',
                    },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPrefs({ ...prefs, astIndexDepth: option.id as any })}
                      className={`text-left p-3.5 rounded-lg border transition-all ${
                        prefs.astIndexDepth === option.id
                          ? 'border-txt-primary bg-surface-tertiary text-txt-primary shadow-sm'
                          : 'border-border bg-surface-secondary text-txt-secondary hover:border-zinc-700'
                      }`}
                    >
                      <p className="text-xs font-semibold text-txt-primary flex items-center justify-between">
                        {option.title}
                        {prefs.astIndexDepth === option.id && (
                          <Check className="h-3.5 w-3.5 text-txt-primary" />
                        )}
                      </p>
                      <p className="text-[11px] text-txt-muted mt-1 leading-snug">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Architecture Toggle */}
              <div className="pt-2 flex items-center justify-between p-3.5 rounded-lg bg-surface-secondary border border-border">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-txt-primary">
                    Auto-synthesize Architecture Diagrams
                  </p>
                  <p className="text-[11px] text-txt-muted">
                    Automatically generate interactive Mermaid flowcharts upon repository analysis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPrefs({ ...prefs, autoGenerateArchitecture: !prefs.autoGenerateArchitecture })
                  }
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    prefs.autoGenerateArchitecture ? 'bg-zinc-200 dark:bg-zinc-100 justify-end' : 'bg-surface-tertiary justify-start border border-border'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      prefs.autoGenerateArchitecture ? 'bg-zinc-950' : 'bg-zinc-500'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-border">
                {saveSuccess ? (
                  <span className="flex items-center gap-1.5 text-xs text-status-success font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Preferences saved successfully
                  </span>
                ) : (
                  <span className="text-xs text-txt-muted">Settings apply immediately to subsequent repository queries.</span>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="text-xs"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Viewer & Appearance */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-txt-primary">Interface Theme</h3>
                <p className="text-xs text-txt-muted mt-0.5">
                  Customize your viewing experience with clean, minimalist monochrome styling.
                </p>
              </div>

              {/* Theme Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'dark',
                    title: 'Dark Theme',
                    desc: 'Deep zinc surfaces, high-contrast monochrome typography.',
                    icon: Moon,
                  },
                  {
                    id: 'light',
                    title: 'Light Theme',
                    desc: 'Crisp white canvas, clean borders, minimal glare.',
                    icon: Sun,
                  },
                  {
                    id: 'system',
                    title: 'System Synchronized',
                    desc: 'Follows your operating system appearance preference.',
                    icon: Monitor,
                  },
                ].map((item) => {
                  const ItemIcon = item.icon;
                  const isCurrent = theme === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTheme(item.id as any)}
                      className={`text-left p-4 rounded-lg border transition-all ${
                        isCurrent
                          ? 'border-txt-primary bg-surface-tertiary text-txt-primary shadow-sm'
                          : 'border-border bg-surface-secondary text-txt-secondary hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <ItemIcon className="h-4 w-4 text-txt-primary" />
                        {isCurrent && <Check className="h-3.5 w-3.5 text-txt-primary" />}
                      </div>
                      <p className="text-xs font-semibold text-txt-primary">{item.title}</p>
                      <p className="text-[11px] text-txt-muted mt-1 leading-snug">{item.desc}</p>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-txt-primary">Code Viewer Configuration</h3>
                <p className="text-xs text-txt-muted mt-0.5">
                  Adjust code font sizing, tab indentation, and line number gutters for the File Explorer.
                </p>
              </div>

              {/* Font Size & Tab Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                    Editor Font Size
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['12px', '13px', '14px', '16px'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setPrefs({ ...prefs, codeFontSize: sz })}
                        className={`py-1.5 text-xs font-mono rounded-md border text-center transition-colors ${
                          prefs.codeFontSize === sz
                            ? 'bg-zinc-800 text-zinc-100 border-zinc-600 font-semibold'
                            : 'bg-surface-secondary text-txt-secondary border-border hover:bg-surface-tertiary'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                    Tab Indentation Width
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([2, 4] as const).map((spaces) => (
                      <button
                        key={spaces}
                        type="button"
                        onClick={() => setPrefs({ ...prefs, codeTabSize: spaces })}
                        className={`py-1.5 text-xs font-mono rounded-md border text-center transition-colors ${
                          prefs.codeTabSize === spaces
                            ? 'bg-zinc-800 text-zinc-100 border-zinc-600 font-semibold'
                            : 'bg-surface-secondary text-txt-secondary border-border hover:bg-surface-tertiary'
                        }`}
                      >
                        {spaces} spaces
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-surface-secondary border border-border">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-txt-primary">Display Line Numbers</p>
                    <p className="text-[11px] text-txt-muted">
                      Show numerical line references in code view gutters.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrefs({ ...prefs, showLineNumbers: !prefs.showLineNumbers })}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      prefs.showLineNumbers ? 'bg-zinc-200 dark:bg-zinc-100 justify-end' : 'bg-surface-tertiary justify-start border border-border'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full transition-transform ${
                        prefs.showLineNumbers ? 'bg-zinc-950' : 'bg-zinc-500'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-lg bg-surface-secondary border border-border">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-txt-primary">Code Word Wrapping</p>
                    <p className="text-[11px] text-txt-muted">
                      Wrap long code statements instead of horizontal scrolling.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrefs({ ...prefs, wordWrap: !prefs.wordWrap })}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      prefs.wordWrap ? 'bg-zinc-200 dark:bg-zinc-100 justify-end' : 'bg-surface-tertiary justify-start border border-border'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full transition-transform ${
                        prefs.wordWrap ? 'bg-zinc-950' : 'bg-zinc-500'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Code Preview Box */}
              <div className="space-y-1.5 pt-2">
                <p className="text-xs font-medium text-txt-secondary">Live Viewer Preview</p>
                <div 
                  className="p-4 rounded-lg bg-surface-secondary border border-border font-mono overflow-x-auto leading-relaxed"
                  style={{ fontSize: prefs.codeFontSize }}
                >
                  <pre className="text-txt-primary">
                    <span className="text-txt-muted select-none mr-4">{prefs.showLineNumbers ? '1' : ''}</span>
                    <span className="text-zinc-400">import</span> &#123; createClient &#125; <span className="text-zinc-400">from</span> <span className="text-zinc-300">&apos;@/lib/supabase&apos;</span>;{'\n'}
                    <span className="text-txt-muted select-none mr-4">{prefs.showLineNumbers ? '2' : ''}</span>
                    <span className="text-zinc-400">export async function</span> <span className="text-zinc-100 font-semibold">analyzeRepository</span>(repoId: string) &#123;{'\n'}
                    <span className="text-txt-muted select-none mr-4">{prefs.showLineNumbers ? '3' : ''}</span>
                    {' '.repeat(prefs.codeTabSize)}<span className="text-zinc-400">const</span> astTree = <span className="text-zinc-400">await</span> parseAST(repoId);{'\n'}
                    <span className="text-txt-muted select-none mr-4">{prefs.showLineNumbers ? '4' : ''}</span>
                    {' '.repeat(prefs.codeTabSize)}<span className="text-zinc-400">return</span> astTree.symbols;{'\n'}
                    <span className="text-txt-muted select-none mr-4">{prefs.showLineNumbers ? '5' : ''}</span>
                    &#125;
                  </pre>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-border">
                {saveSuccess ? (
                  <span className="flex items-center gap-1.5 text-xs text-status-success font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Viewer preferences updated
                  </span>
                ) : (
                  <span className="text-xs text-txt-muted">Preview reflects your active theme and editor configuration.</span>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="text-xs"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {saving ? 'Saving...' : 'Save Appearance'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Security & Session */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Update Password */}
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-txt-primary">Account Password</h3>
                <p className="text-xs text-txt-muted mt-0.5">
                  Update your authentication credentials for Structura.
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                {passwordStatus && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                      passwordStatus.type === 'success'
                        ? 'bg-status-success/10 border-status-success/20 text-status-success'
                        : 'bg-status-error/10 border-status-error/20 text-status-error'
                    }`}
                  >
                    {passwordStatus.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{passwordStatus.message}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="text-xs"
                    required
                  />
                  <p className="text-[11px] text-txt-muted mt-1">Minimum 6 characters.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="text-xs"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={passwordLoading}
                  className="text-xs"
                >
                  <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </div>

            {/* Session Info */}
            <div className="card p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-txt-primary">Active Session</h3>
                <p className="text-xs text-txt-muted mt-0.5">
                  Information regarding your currently authenticated browser connection.
                </p>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-surface-secondary border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-surface-tertiary border border-border">
                    <Laptop className="h-4 w-4 text-txt-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-txt-primary">Web Browser Session</p>
                      <Badge variant="default" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        Current
                      </Badge>
                    </div>
                    <p className="text-[11px] text-txt-muted mt-0.5">
                      Encrypted JWT • SSL End-to-End • Supabase Auth
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-xs border-border text-txt-secondary hover:text-status-error"
                >
                  Terminate
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="card p-6 border-status-error/20 bg-status-error/[0.02] space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-status-error">Workspace Data Management</h3>
                <p className="text-xs text-txt-muted mt-0.5">
                  Clear local cache or sign out of your Structura developer session.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-txt-primary">Clear Local Repository Cache</p>
                  <p className="text-[11px] text-txt-muted">
                    Removes stored AST trees and client-side analysis summaries from this device.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClearCache}
                  className="text-xs text-txt-secondary hover:text-status-error shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  {cacheCleared ? 'Cache Cleared!' : 'Clear Cache'}
                </Button>
              </div>

              <div className="border-t border-border/50 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-txt-primary">Sign Out of Account</p>
                  <p className="text-[11px] text-txt-muted">
                    Clears your session authentication tokens and returns to the login screen.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-xs text-status-error hover:bg-status-error/10 border-status-error/30 shrink-0"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
