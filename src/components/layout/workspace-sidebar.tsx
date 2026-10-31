'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Layers, 
  Network, 
  FileCode2, 
  GitFork, 
  MessageSquare, 
  Map, 
  Bug, 
  ArrowLeft,
  ExternalLink,
  Star,
  GitBranch
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Repository } from '@/types';

interface WorkspaceSidebarProps {
  repository: Repository;
}

export function WorkspaceSidebar({ repository }: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const activeRepoId = (params?.repositoryId as string) || repository.id;
  const baseUrl = `/workspace/${activeRepoId}`;

  const navItems = [
    { label: 'Overview', href: baseUrl, icon: Layers, exact: true },
    { label: 'Architecture', href: `${baseUrl}/architecture`, icon: Network },
    { label: 'File Explorer', href: `${baseUrl}/files`, icon: FileCode2 },
    { label: 'Dependencies', href: `${baseUrl}/dependencies`, icon: GitFork },
    { label: 'Ask Codebase', href: `${baseUrl}/chat`, icon: MessageSquare },
    { label: 'Contributor Roadmap', href: `${baseUrl}/roadmap`, icon: Map },
    { label: 'Bug & Feature Locator', href: `${baseUrl}/issues`, icon: Bug },
  ];

  return (
    <aside className="w-64 border-r border-border bg-surface-primary flex flex-col flex-shrink-0 h-[calc(100vh-3.5rem)] sticky top-14">
      {/* Repository identity */}
      <div className="p-4 border-b border-border">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-txt-muted hover:text-txt-primary mb-3 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Dashboard
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-txt-primary truncate max-w-[170px]" title={repository.name}>
              {repository.name}
            </h2>
            <p className="text-xs text-txt-muted truncate max-w-[170px]">
              {repository.owner}
            </p>
          </div>
          <a
            href={repository.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded text-txt-muted hover:text-txt-primary hover:bg-surface-secondary"
            title="Open on GitHub"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="flex items-center gap-3 mt-3 text-[11px] text-txt-muted font-mono">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-status-warning" />
            {repository.stars.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            {repository.default_branch}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-txt-muted">
          Workspace Views
        </div>
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                isActive
                  ? 'text-txt-primary font-semibold'
                  : 'text-txt-secondary hover:text-txt-primary hover:bg-surface-secondary/70'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 bg-surface-secondary rounded-lg border border-border"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2.5">
                <item.icon className={cn('h-4 w-4', isActive ? 'text-txt-primary' : 'text-txt-muted')} />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-border">
        <div className="p-2.5 rounded-lg bg-surface-secondary border border-border text-[11px] text-txt-muted flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <span>Structura Engine</span>
          </div>
          <span className="font-mono text-[9px] text-accent uppercase font-semibold">Active</span>
        </div>
      </div>
    </aside>
  );
}

