'use client';

import { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode2, 
  ChevronRight, 
  ChevronDown, 
  ChevronsUpDown
} from 'lucide-react';
import { formatFileSize, cn } from '@/lib/utils';
import { RepositoryFile } from '@/types';

interface FileTreeViewProps {
  files: RepositoryFile[];
  selectedFile: RepositoryFile | null;
  onSelectFile: (file: RepositoryFile) => void;
  searchQuery?: string;
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  file?: RepositoryFile;
  children: Map<string, TreeNode>;
}

export function FileTreeView({
  files,
  selectedFile,
  onSelectFile,
  searchQuery = '',
}: FileTreeViewProps) {
  // Build nested tree structure
  const rootTree = useMemo(() => {
    const root: TreeNode = {
      name: '',
      path: '',
      isDirectory: true,
      children: new Map(),
    };

    for (const file of files) {
      const parts = file.file_path.split('/');
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        const currentPath = parts.slice(0, i + 1).join('/');

        if (!current.children.has(part)) {
          current.children.set(part, {
            name: part,
            path: currentPath,
            isDirectory: !isFile,
            file: isFile ? file : undefined,
            children: new Map(),
          });
        }
        current = current.children.get(part)!;
      }
    }

    return root;
  }, [files]);

  // Expanded folders state (default: top-level folders expanded)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const file of files) {
      const parts = file.file_path.split('/');
      if (parts.length > 1) {
        initial.add(parts[0]);
      }
    }
    return initial;
  });

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    for (const file of files) {
      const parts = file.file_path.split('/');
      for (let i = 1; i < parts.length; i++) {
        all.add(parts.slice(0, i).join('/'));
      }
    }
    setExpandedFolders(all);
  };

  const collapseAll = () => {
    setExpandedFolders(new Set());
  };

  // Render tree node recursively
  const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    // If search active, check if node matches
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!node.isDirectory) {
        if (!node.path.toLowerCase().includes(q)) return null;
      }
    }

    if (node.isDirectory) {
      // Sort: folders first, then alphabetically
      const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      const isExpanded = expandedFolders.has(node.path) || Boolean(searchQuery.trim());

      return (
        <div key={node.path} className="select-none">
          {node.path && (
            <button
              onClick={() => toggleFolder(node.path)}
              className="w-full text-left px-2 py-1 rounded text-xs font-mono flex items-center gap-1.5 text-txt-secondary hover:text-txt-primary hover:bg-surface-secondary/80 transition-colors"
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-txt-muted shrink-0" />
              ) : (
                <ChevronRight className="h-3 w-3 text-txt-muted shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
              ) : (
                <Folder className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              )}
              <span className="truncate font-medium">{node.name}</span>
            </button>
          )}

          {isExpanded && (
            <div>
              {sortedChildren.map((child) => renderNode(child, node.path ? depth + 1 : depth))}
            </div>
          )}
        </div>
      );
    }

    // File Node
    const isSelected = selectedFile?.file_path === node.path;

    return (
      <button
        key={node.path}
        onClick={() => node.file && onSelectFile(node.file)}
        className={cn(
          'w-full text-left px-2 py-1.5 rounded text-xs font-mono flex items-center justify-between transition-colors',
          isSelected
            ? 'bg-zinc-800 text-white font-medium border border-zinc-700 shadow-sm'
            : 'text-txt-secondary hover:bg-surface-secondary hover:text-txt-primary'
        )}
        style={{ paddingLeft: `${depth * 14 + 18}px` }}
      >
        <div className="flex items-center gap-2 truncate">
          <FileCode2 className="h-3.5 w-3.5 text-txt-muted shrink-0" />
          <span className="truncate">{node.name}</span>
        </div>
        {node.file && (
          <span className="text-[10px] text-txt-muted ml-1.5 shrink-0">
            {formatFileSize(node.file.file_size)}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Folder Tree Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-surface-primary text-[11px] text-txt-muted">
        <span className="font-mono uppercase tracking-wider text-[10px]">Explorer</span>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="hover:text-txt-primary transition-colors text-[10px]"
            title="Expand All Folders"
          >
            Expand
          </button>
          <span>/</span>
          <button
            onClick={collapseAll}
            className="hover:text-txt-primary transition-colors text-[10px]"
            title="Collapse All Folders"
          >
            Collapse
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {renderNode(rootTree, 0)}
      </div>
    </div>
  );
}
