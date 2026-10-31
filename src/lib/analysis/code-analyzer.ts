import { RepositoryFile } from '@/types';

export interface ExtractedSymbol {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'component' | 'route';
  startLine: number;
  endLine: number;
  signature?: string;
}

export interface FileAnalysis {
  filePath: string;
  language: string;
  imports: Array<{
    source: string;
    specifiers: string[];
    isExternal: boolean;
    resolvedPath?: string;
  }>;
  exports: string[];
  symbols: ExtractedSymbol[];
  apiRoutes: string[];
  dbReferences: string[];
  envReferences: string[];
  lineCount: number;
  layer?: 'frontend' | 'api' | 'services' | 'database' | 'config' | 'utils';
}

export interface RepositoryDependencyGraph {
  files: Map<string, FileAnalysis>;
  incomingDependencies: Map<string, string[]>; // file -> files that import it
  outgoingDependencies: Map<string, string[]>; // file -> files it imports
  modules: Map<string, string[]>;             // directory -> files in directory
  confirmedEdges: Array<{
    source: string;
    target: string;
    type: 'import' | 'module';
  }>;
}

/**
 * Analyzes a single file's source code to extract structured AST metadata
 */
export function analyzeFile(file: RepositoryFile | { file_path?: string; path?: string; content?: string; language?: string }): FileAnalysis {
  const content = file.content || '';
  const lines = content.split('\n');
  const filePath = (file as any).file_path || (file as any).path || '';
  const language = file.language || detectLanguageFromPath(filePath);

  const imports: FileAnalysis['imports'] = [];
  const exports: string[] = [];
  const symbols: ExtractedSymbol[] = [];
  const apiRoutes: string[] = [];
  const dbReferences: string[] = [];
  const envReferences = new Set<string>();

  const isJsTs = ['typescript', 'javascript', 'tsx', 'jsx'].includes(language.toLowerCase()) || 
                 /\.(js|jsx|ts|tsx|mjs)$/i.test(filePath);
  const isPython = language.toLowerCase() === 'python' || /\.py$/i.test(filePath);
  const isGo = language.toLowerCase() === 'go' || /\.go$/i.test(filePath);
  const isRust = language.toLowerCase() === 'rust' || /\.rs$/i.test(filePath);

  // Regex patterns
  const esmImportRegex = /import\s+(?:(?:(\{[^}]+\})|([a-zA-Z0-9_$]+)|(?:\*\s+as\s+([a-zA-Z0-9_$]+)))\s+from\s+)?['"]([^'"]+)['"]/g;
  const commonJsRequireRegex = /(?:const|let|var)\s+(?:(\{[^}]+\})|([a-zA-Z0-9_$]+))\s*=\s*require\(['"]([^'"]+)['"]\)/g;
  const pyImportRegex = /^(?:from\s+([a-zA-Z0-9_.]+)\s+import\s+([^#\n]+)|import\s+([^#\n]+))/gm;
  const goImportRegex = /import\s*\(([\s\S]*?)\)|import\s+([a-zA-Z0-9_]+)?\s*["']([^"']+)["']/g;

  // 1. JS / TS Import Parsing
  if (isJsTs) {
    let match;
    while ((match = esmImportRegex.exec(content)) !== null) {
      const named = match[1];
      const defaultImport = match[2];
      const namespace = match[3];
      const source = match[4];
      const specifiers: string[] = [];

      if (named) {
        named.replace(/[{}]/g, '').split(',').forEach(s => {
          const clean = s.trim().split(/\s+as\s+/)[0].trim();
          if (clean) specifiers.push(clean);
        });
      }
      if (defaultImport) specifiers.push(defaultImport.trim());
      if (namespace) specifiers.push(namespace.trim());

      const isExternal = !source.startsWith('.') && !source.startsWith('/');
      imports.push({ source, specifiers, isExternal });
    }

    while ((match = commonJsRequireRegex.exec(content)) !== null) {
      const spec = match[1] || match[2];
      const source = match[3];
      const isExternal = !source.startsWith('.') && !source.startsWith('/');
      imports.push({
        source,
        specifiers: spec ? [spec.trim().replace(/[{}]/g, '')] : [],
        isExternal,
      });
    }

    // Exports
    const exportRegex = /export\s+(?:default\s+)?(?:async\s+)?(?:function\*?|class|const|let|var|type|interface)\s+([a-zA-Z0-9_$]+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      if (match[1]) exports.push(match[1]);
    }
  } else if (isPython) {
    let match;
    while ((match = pyImportRegex.exec(content)) !== null) {
      const fromPkg = match[1];
      const fromItems = match[2];
      const directImport = match[3];

      if (fromPkg) {
        const specifiers = fromItems.split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
        imports.push({
          source: fromPkg,
          specifiers,
          isExternal: !fromPkg.startsWith('.'),
        });
      } else if (directImport) {
        directImport.split(',').forEach(pkg => {
          const clean = pkg.trim().split(/\s+as\s+/)[0];
          if (clean) {
            imports.push({
              source: clean,
              specifiers: [clean],
              isExternal: true,
            });
          }
        });
      }
    }
  }

  // 2. Line by line scanning for symbols, line ranges, and references
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    // Environment variables (safe extraction of variable names only)
    const envMatches = line.matchAll(/(?:process\.env|os\.environ(?:\[|\.get\()|import\.meta\.env)\.([a-zA-Z0-9_]+)/g);
    for (const em of envMatches) {
      if (em[1]) envReferences.add(em[1]);
    }

    // Database keywords
    if (/supabase|prisma|drizzle|sequelize|mongoose|typeorm|\.query\(|\.from\(/i.test(line)) {
      const dbMatch = line.match(/(?:from|model|table)\(['"]([a-zA-Z0-9_-]+)['"]\)/i);
      if (dbMatch && dbMatch[1]) {
        dbReferences.push(dbMatch[1]);
      }
    }

    // API Routes detection
    if (/(?:router|app)\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/i.test(line)) {
      const routeMatch = line.match(/(?:router|app)\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/i);
      if (routeMatch) {
        apiRoutes.push(`${routeMatch[1].toUpperCase()} ${routeMatch[2]}`);
      }
    } else if (filePath.includes('/api/') || filePath.includes('route.')) {
      if (/export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/i.test(line)) {
        const verbMatch = line.match(/function\s+(GET|POST|PUT|DELETE|PATCH)/i);
        if (verbMatch) {
          apiRoutes.push(verbMatch[1].toUpperCase());
        }
      }
    }

    // Function declarations
    const fnMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/);
    if (fnMatch) {
      symbols.push({
        name: fnMatch[1],
        kind: 'function',
        startLine: lineNum,
        endLine: estimateEndLine(lines, i),
        signature: `function ${fnMatch[1]}(${fnMatch[2] || ''})`,
      });
      continue;
    }

    // Class declarations
    const classMatch = line.match(/(?:export\s+)?class\s+([a-zA-Z0-9_$]+)(?:\s+extends\s+[a-zA-Z0-9_$]+)?/);
    if (classMatch) {
      symbols.push({
        name: classMatch[1],
        kind: 'class',
        startLine: lineNum,
        endLine: estimateEndLine(lines, i),
        signature: classMatch[0].trim(),
      });
      continue;
    }

    // React Component or arrow function assignment
    const arrowFnMatch = line.match(/(?:export\s+)?(?:const|let)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/);
    if (arrowFnMatch) {
      const name = arrowFnMatch[1];
      const isComponent = /^[A-Z]/.test(name);
      symbols.push({
        name,
        kind: isComponent ? 'component' : 'function',
        startLine: lineNum,
        endLine: estimateEndLine(lines, i),
        signature: `const ${name} = (...) =>`,
      });
      continue;
    }

    // Class methods (e.g. async authenticateUser(token: string) { or public foo() {)
    if (isJsTs) {
      const methodMatch = line.match(/^\s*(?:public\s+|private\s+|protected\s+|static\s+|async\s+)*([a-zA-Z0-9_$]+)\s*\(([^)]*)\)\s*(?::\s*[^;{]+)?\s*\{/);
      if (methodMatch && !['if', 'for', 'while', 'switch', 'catch', 'function', 'class'].includes(methodMatch[1])) {
        symbols.push({
          name: methodMatch[1],
          kind: 'function',
          startLine: lineNum,
          endLine: estimateEndLine(lines, i),
          signature: `${methodMatch[1]}(${methodMatch[2] || ''})`,
        });
        continue;
      }
    }

    // Python def / class
    if (isPython) {
      const pyDef = line.match(/^(\s*)def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\):/);
      if (pyDef) {
        symbols.push({
          name: pyDef[2],
          kind: 'function',
          startLine: lineNum,
          endLine: Math.min(lineNum + 20, lines.length),
          signature: `def ${pyDef[2]}(${pyDef[3]})`,
        });
      }
      const pyClass = line.match(/^(\s*)class\s+([a-zA-Z0-9_]+)(?:\([^)]*\))?:/);
      if (pyClass) {
        symbols.push({
          name: pyClass[2],
          kind: 'class',
          startLine: lineNum,
          endLine: Math.min(lineNum + 40, lines.length),
          signature: `class ${pyClass[2]}`,
        });
      }
    }
  }

  return {
    filePath,
    language,
    imports,
    exports,
    symbols,
    apiRoutes: Array.from(new Set(apiRoutes)),
    dbReferences: Array.from(new Set(dbReferences)),
    envReferences: Array.from(envReferences),
    lineCount: lines.length,
    layer: detectLayer(filePath, imports, apiRoutes, dbReferences),
  };
}

/**
 * Helper to classify repository layer based on path, imports, and AST markers
 */
export function detectLayer(
  filePath: string,
  imports?: any[],
  apiRoutes?: string[],
  dbReferences?: string[]
): 'frontend' | 'api' | 'services' | 'database' | 'config' | 'utils' {
  const p = filePath.toLowerCase();
  if (p.includes('/api/') || p.includes('/routes/') || p.includes('/controllers/') || (apiRoutes && apiRoutes.length > 0)) {
    return 'api';
  }
  if (p.includes('/components/') || p.includes('/pages/') || p.includes('/app/') || p.includes('/views/') || p.endsWith('.tsx') || p.endsWith('.jsx')) {
    return 'frontend';
  }
  if (p.includes('/db/') || p.includes('/database/') || p.includes('/models/') || p.includes('schema') || p.includes('/prisma/') || (dbReferences && dbReferences.length > 0)) {
    return 'database';
  }
  if (p.includes('/services/') || p.includes('/lib/services') || p.includes('/business/') || p.includes('/handlers/')) {
    return 'services';
  }
  if (p.includes('config') || p.endsWith('.json') || p.endsWith('.yaml') || p.endsWith('.yml') || p.includes('.env')) {
    return 'config';
  }
  return 'utils';
}

/**
 * Convenience helper to analyze code by path and raw content string
 */
export function analyzeCodeFile(path: string, content: string, language?: string): FileAnalysis {
  return analyzeFile({ file_path: path, path, content, language });
}

/**
 * Resolves an import source string against all repository file paths
 */
function resolveImportPath(currentFile: string, importSource: string, allFiles: string[]): string | undefined {
  if (!importSource.startsWith('.')) return undefined;

  const currentDir = currentFile.split('/').slice(0, -1).join('/');
  const normalizedParts = (currentDir ? `${currentDir}/${importSource}` : importSource).split('/');
  const resolvedParts: string[] = [];

  for (const part of normalizedParts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      resolvedParts.pop();
    } else {
      resolvedParts.push(part);
    }
  }

  const basePath = resolvedParts.join('/');
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];

  for (const ext of extensions) {
    const candidate = `${basePath}${ext}`;
    if (allFiles.includes(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

/**
 * Builds a repository-wide dependency graph with confirmed imports and exports
 */
export function buildRepositoryDependencyGraph(files: any[]): RepositoryDependencyGraph {
  const fileAnalyses = new Map<string, FileAnalysis>();
  const incomingDependencies = new Map<string, string[]>();
  const outgoingDependencies = new Map<string, string[]>();
  const modules = new Map<string, string[]>();
  const confirmedEdges: RepositoryDependencyGraph['confirmedEdges'] = [];

  const allFilePaths = files.map(f => f.file_path || f.path || '').filter(Boolean);

  // Initialize data structures
  for (const file of files) {
    const filePath = file.file_path || file.path || '';
    if (!filePath) continue;
    incomingDependencies.set(filePath, []);
    outgoingDependencies.set(filePath, []);

    // Module grouping by parent directory
    const parts = filePath.split('/');
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
    if (!modules.has(dir)) {
      modules.set(dir, []);
    }
    modules.get(dir)!.push(filePath);
  }

  // Analyze each file
  for (const file of files) {
    const filePath = file.file_path || file.path || '';
    if (!filePath) continue;
    const analysis = analyzeFile(file);

    // Resolve internal relative imports
    for (const imp of analysis.imports) {
      if (!imp.isExternal) {
        const resolved = resolveImportPath(filePath, imp.source, allFilePaths);
        if (resolved) {
          imp.resolvedPath = resolved;

          // Outgoing: file -> resolved
          outgoingDependencies.get(filePath)?.push(resolved);

          // Incoming: resolved <- file
          if (!incomingDependencies.get(resolved)?.includes(filePath)) {
            incomingDependencies.get(resolved)?.push(filePath);
          }

          confirmedEdges.push({
            source: filePath,
            target: resolved,
            type: 'import',
          });
        }
      }
    }

    fileAnalyses.set(filePath, analysis);
  }

  return {
    files: fileAnalyses,
    incomingDependencies,
    outgoingDependencies,
    modules,
    confirmedEdges,
  };
}

function estimateEndLine(lines: string[], startIdx: number): number {
  let openBraces = 0;
  let foundFirst = false;

  for (let i = startIdx; i < Math.min(startIdx + 120, lines.length); i++) {
    const l = lines[i];
    for (const ch of l) {
      if (ch === '{') {
        openBraces++;
        foundFirst = true;
      } else if (ch === '}') {
        openBraces--;
        if (foundFirst && openBraces <= 0) {
          return i + 1;
        }
      }
    }
  }

  return Math.min(startIdx + 25, lines.length);
}

function detectLanguageFromPath(path: string): string {
  const ext = (path || '').split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts': return 'TypeScript';
    case 'tsx': return 'TypeScript (React)';
    case 'js': return 'JavaScript';
    case 'jsx': return 'JavaScript (React)';
    case 'py': return 'Python';
    case 'go': return 'Go';
    case 'rs': return 'Rust';
    case 'java': return 'Java';
    case 'rb': return 'Ruby';
    case 'html': return 'HTML';
    case 'css': return 'CSS';
    case 'json': return 'JSON';
    default: return 'Source';
  }
}
