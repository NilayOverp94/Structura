import { GITHUB_CONFIG, LANGUAGE_MAP } from '@/config/constants';
import { GitHubTreeItem } from '@/types';

export function filterRepositoryFiles(tree: GitHubTreeItem[]): GitHubTreeItem[] {
  return tree.filter((item) => {
    if (item.type !== 'blob') return false;

    const path = item.path.toLowerCase();
    const parts = path.split('/');

    // Check excluded directories
    for (const part of parts) {
      if ((GITHUB_CONFIG.excludedDirs as readonly string[]).includes(part)) return false;
    }

    // Check excluded files
    const fileName = parts[parts.length - 1];
    if ((GITHUB_CONFIG.excludedFiles as readonly string[]).includes(fileName)) return false;

    // Check file extensions
    const ext = '.' + fileName.split('.').pop();
    if ((GITHUB_CONFIG.excludedExtensions as readonly string[]).includes(ext)) return false;

    // Check file size
    if (item.size && item.size > GITHUB_CONFIG.maxFileSize) return false;

    // Check sensitive patterns
    for (const pattern of GITHUB_CONFIG.sensitivePatterns) {
      if (pattern.test(item.path)) return false;
    }

    return true;
  });
}

export function detectLanguage(filePath: string): string | null {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (!ext) {
    const fileName = filePath.split('/').pop()?.toLowerCase() || '';
    if (fileName === 'dockerfile') return 'Dockerfile';
    if (fileName === 'makefile') return 'Makefile';
    return null;
  }
  return LANGUAGE_MAP[ext] || null;
}

export function categorizeFile(path: string): string {
  const lower = path.toLowerCase();
  
  if (lower.includes('test') || lower.includes('spec') || lower.includes('__tests__')) return 'tests';
  if (lower.includes('doc') || lower.endsWith('.md') || lower.endsWith('.mdx')) return 'docs';
  if (lower.match(/\.(config|rc)\./)) return 'config';
  if (lower.includes('migration')) return 'database';
  if (lower.includes('component') || lower.includes('pages') || lower.includes('views') || lower.includes('ui')) return 'frontend';
  if (lower.includes('route') || lower.includes('controller') || lower.includes('handler') || lower.includes('api')) return 'api';
  if (lower.includes('service') || lower.includes('provider')) return 'services';
  if (lower.includes('model') || lower.includes('schema') || lower.includes('entity')) return 'database';
  if (lower.includes('middleware') || lower.includes('guard')) return 'middleware';
  if (lower.includes('util') || lower.includes('helper') || lower.includes('lib')) return 'utilities';
  if (lower.includes('auth')) return 'auth';
  if (lower.includes('hook') || lower.includes('context')) return 'frontend';
  if (lower.includes('style') || lower.includes('.css') || lower.includes('.scss')) return 'styles';
  
  return 'source';
}

export function prioritizeFiles(files: GitHubTreeItem[]): GitHubTreeItem[] {
  const priorityOrder = [
    'readme', 'package.json', 'index', 'main', 'app', 'server',
    'config', 'route', 'api', 'auth', 'database', 'schema', 'model',
  ];

  return [...files].sort((a, b) => {
    const aLower = a.path.toLowerCase();
    const bLower = b.path.toLowerCase();
    
    const aPriority = priorityOrder.findIndex(p => aLower.includes(p));
    const bPriority = priorityOrder.findIndex(p => bLower.includes(p));

    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;
    
    return a.path.split('/').length - b.path.split('/').length;
  });
}
