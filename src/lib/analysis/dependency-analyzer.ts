import { DependencyInfo, RepositoryFile } from '@/types';
import { analyzeFile } from './code-analyzer';

export function extractDependencies(files: (RepositoryFile | { path: string; content: string; file_path?: string })[]): DependencyInfo[] {
  const dependencies: DependencyInfo[] = [];
  const seen = new Set<string>();

  // 1. Gather all imported package names across all source files to track usage
  const importUsageMap = new Map<string, string[]>(); // package name -> [files using it]
  for (const file of files) {
    const filePath = (file as any).file_path || (file as any).path || '';
    if (!filePath) continue;
    const analysis = analyzeFile(file as any);
    for (const imp of analysis.imports) {
      if (imp.isExternal) {
        // e.g. "@supabase/supabase-js" or "react" or "lodash/debounce"
        const pkgName = imp.source.startsWith('@') 
          ? imp.source.split('/').slice(0, 2).join('/')
          : imp.source.split('/')[0];
        
        if (!importUsageMap.has(pkgName)) {
          importUsageMap.set(pkgName, []);
        }
        if (!importUsageMap.get(pkgName)!.includes(filePath)) {
          importUsageMap.get(pkgName)!.push(filePath);
        }
      }
    }
  }

  // 2. Parse all declared manifest files
  for (const file of files) {
    const filePath = (file as any).file_path || (file as any).path || '';
    const fileName = filePath.split('/').pop()?.toLowerCase() || '';

    if (fileName === 'package.json') {
      dependencies.push(...extractNpmDependencies(file.content, seen, importUsageMap));
    } else if (fileName === 'requirements.txt') {
      dependencies.push(...extractPipDependencies(file.content, seen, importUsageMap));
    } else if (fileName === 'pyproject.toml') {
      dependencies.push(...extractPyprojectDependencies(file.content, seen, importUsageMap));
    } else if (fileName === 'pom.xml') {
      dependencies.push(...extractMavenDependencies(file.content, seen, importUsageMap));
    } else if (fileName === 'build.gradle' || fileName === 'build.gradle.kts') {
      dependencies.push(...extractGradleDependencies(file.content, seen, importUsageMap));
    } else if (fileName === 'go.mod') {
      dependencies.push(...extractGoDependencies(file.content, seen, importUsageMap));
    } else if (fileName === 'cargo.toml') {
      dependencies.push(...extractCargoDependencies(file.content, seen, importUsageMap));
    } else if (fileName === 'gemfile') {
      dependencies.push(...extractGemfileDependencies(file.content, seen, importUsageMap));
    }
  }

  // 3. Identify undeclared dependencies discovered through source imports
  for (const [pkgName, usedFiles] of importUsageMap.entries()) {
    if (!seen.has(pkgName) && !pkgName.startsWith('.') && !isStandardLibrary(pkgName)) {
      seen.add(pkgName);
      dependencies.push({
        name: pkgName,
        version: 'discovered in source',
        type: 'production',
        ecosystem: 'discovered',
        category: categorizePackage(pkgName),
        purpose: getPackagePurpose(pkgName),
        used_in: usedFiles.slice(0, 5),
        is_declared: false,
      });
    }
  }

  return dependencies;
}

function extractNpmDependencies(
  content: string, 
  seen: Set<string>,
  importUsageMap: Map<string, string[]>
): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  try {
    const pkg = JSON.parse(content);
    
    if (pkg.dependencies) {
      for (const [name, version] of Object.entries(pkg.dependencies)) {
        if (!seen.has(name)) {
          seen.add(name);
          deps.push({
            name,
            version: version as string,
            type: 'production',
            ecosystem: 'npm',
            category: categorizeNpmPackage(name),
            purpose: getPackagePurpose(name),
            used_in: importUsageMap.get(name) || [],
            is_declared: true,
          });
        }
      }
    }

    if (pkg.devDependencies) {
      for (const [name, version] of Object.entries(pkg.devDependencies)) {
        if (!seen.has(name)) {
          seen.add(name);
          deps.push({
            name,
            version: version as string,
            type: 'development',
            ecosystem: 'npm',
            category: categorizeNpmPackage(name),
            purpose: getPackagePurpose(name),
            used_in: importUsageMap.get(name) || [],
            is_declared: true,
          });
        }
      }
    }
  } catch {
    // Ignore JSON parse error
  }
  return deps;
}

function extractPipDependencies(
  content: string, 
  seen: Set<string>,
  importUsageMap: Map<string, string[]>
): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) continue;
    
    const match = trimmed.match(/^([a-zA-Z0-9_\-.]+)(?:[><=!~]+(.+))?/);
    if (match && !seen.has(match[1])) {
      const name = match[1];
      seen.add(name);
      deps.push({
        name,
        version: match[2] || '*',
        type: 'production',
        ecosystem: 'pypi',
        category: 'Python',
        purpose: getPackagePurpose(name),
        used_in: importUsageMap.get(name) || [],
        is_declared: true,
      });
    }
  }
  return deps;
}

function extractPyprojectDependencies(
  content: string, 
  seen: Set<string>,
  importUsageMap: Map<string, string[]>
): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  const lines = content.split('\n');
  let inDependencies = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[') && trimmed.includes('dependencies')) {
      inDependencies = true;
      continue;
    } else if (trimmed.startsWith('[') && inDependencies) {
      inDependencies = false;
    }

    if (inDependencies) {
      const match = trimmed.match(/^([a-zA-Z0-9_\-]+)\s*=\s*["']?([^"']+)["']?/);
      if (match && !seen.has(match[1])) {
        const name = match[1];
        seen.add(name);
        deps.push({
          name,
          version: match[2] || '*',
          type: 'production',
          ecosystem: 'pypi',
          category: 'Python',
          purpose: getPackagePurpose(name),
          used_in: importUsageMap.get(name) || [],
          is_declared: true,
        });
      }
    }
  }
  return deps;
}

function extractMavenDependencies(
  content: string, 
  seen: Set<string>,
  importUsageMap: Map<string, string[]>
): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  const depBlockRegex = /<dependency>([\s\S]*?)<\/dependency>/g;
  let match;

  while ((match = depBlockRegex.exec(content)) !== null) {
    const block = match[1];
    const groupId = block.match(/<groupId>(.*?)<\/groupId>/)?.[1] || '';
    const artifactId = block.match(/<artifactId>(.*?)<\/artifactId>/)?.[1] || '';
    const version = block.match(/<version>(.*?)<\/version>/)?.[1] || 'managed';
    const scope = block.match(/<scope>(.*?)<\/scope>/)?.[1] || 'compile';

    const name = `${groupId}:${artifactId}`;
    if (artifactId && !seen.has(name)) {
      seen.add(name);
      deps.push({
        name,
        version,
        type: scope === 'test' ? 'development' : 'production',
        ecosystem: 'maven',
        category: 'Java / JVM',
        purpose: getPackagePurpose(artifactId),
        used_in: importUsageMap.get(artifactId) || [],
        is_declared: true,
      });
    }
  }
  return deps;
}

function extractGradleDependencies(
  content: string, 
  seen: Set<string>,
  importUsageMap: Map<string, string[]>
): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  const gradleRegex = /(implementation|api|testImplementation)\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = gradleRegex.exec(content)) !== null) {
    const type = match[1] === 'testImplementation' ? 'development' : 'production';
    const spec = match[2];
    const parts = spec.split(':');
    const name = parts.length > 1 ? `${parts[0]}:${parts[1]}` : spec;
    const version = parts[2] || '*';

    if (!seen.has(name)) {
      seen.add(name);
      deps.push({
        name,
        version,
        type,
        ecosystem: 'gradle',
        category: 'JVM',
        purpose: getPackagePurpose(name),
        used_in: importUsageMap.get(name) || [],
        is_declared: true,
      });
    }
  }
  return deps;
}

function extractGoDependencies(
  content: string, 
  seen: Set<string>,
  importUsageMap: Map<string, string[]>
): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  const requireBlock = content.match(/require\s*\(([\s\S]*?)\)/);
  if (requireBlock) {
    const lines = requireBlock[1].split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^(\S+)\s+(\S+)/);
      if (match && !seen.has(match[1])) {
        seen.add(match[1]);
        deps.push({ 
          name: match[1], 
          version: match[2], 
          type: 'production', 
          ecosystem: 'go',
          category: 'Go', 
          purpose: `Go module ${match[1]}`,
          used_in: importUsageMap.get(match[1]) || [],
          is_declared: true,
        });
      }
    }
  }
  return deps;
}

function extractCargoDependencies(
  content: string, 
  seen: Set<string>,
  importUsageMap: Map<string, string[]>
): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  const lines = content.split('\n');
  let inDependencies = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[') && (trimmed === '[dependencies]' || trimmed === '[dev-dependencies]')) {
      inDependencies = true;
      continue;
    } else if (trimmed.startsWith('[') && inDependencies) {
      inDependencies = false;
      continue;
    }

    if (inDependencies && trimmed && !trimmed.startsWith('#')) {
      const keyVal = trimmed.match(/^([a-zA-Z0-9_\-]+)\s*=\s*(.+)$/);
      if (keyVal && !seen.has(keyVal[1])) {
        const name = keyVal[1];
        let val = keyVal[2].trim();
        const versionMatch = val.match(/version\s*=\s*["']([^"']+)["']/);
        if (versionMatch) {
          val = versionMatch[1];
        } else {
          val = val.replace(/^["']|["']$/g, '').trim();
        }
        seen.add(name);
        deps.push({ 
          name, 
          version: val || '*', 
          type: 'production', 
          ecosystem: 'cargo',
          category: 'Rust', 
          purpose: `Rust crate ${name}`,
          used_in: importUsageMap.get(name) || [],
          is_declared: true,
        });
      }
    }
  }
  return deps;
}

function extractGemfileDependencies(
  content: string, 
  seen: Set<string>,
  importUsageMap: Map<string, string[]>
): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.trim().match(/^gem\s+['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/);
    if (match && !seen.has(match[1])) {
      seen.add(match[1]);
      deps.push({
        name: match[1],
        version: match[2] || '*',
        type: 'production',
        ecosystem: 'rubygems',
        category: 'Ruby',
        purpose: `Ruby gem ${match[1]}`,
        used_in: importUsageMap.get(match[1]) || [],
        is_declared: true,
      });
    }
  }
  return deps;
}

function isStandardLibrary(name: string): boolean {
  const std = ['fs', 'path', 'http', 'https', 'crypto', 'os', 'child_process', 'stream', 'util', 'events', 'sys', 'math', 'time', 'json', 'io'];
  return std.includes(name);
}

function getPackagePurpose(name: string): string {
  const purposes: Record<string, string> = {
    react: 'Declarative component rendering architecture',
    'react-dom': 'DOM rendering backend for React web applications',
    next: 'Server-side rendering, App Router, and static asset generation',
    tailwindcss: 'Atomic CSS utility classes and design system compiler',
    typescript: 'Compile-time static type analysis and checking',
    '@supabase/supabase-js': 'Client SDK for Supabase Postgres, Auth, and Storage',
    '@google/generative-ai': 'Official SDK for Gemini multimodal reasoning and vector embeddings',
    zod: 'Composable type-safe schema validation engine',
    'lucide-react': 'Modern SVG vector icon collection',
    reactflow: 'Node-based interactive workflow and graph visualization canvas',
    'framer-motion': 'Production-ready motion physics and animation framework',
    recharts: 'Declarative chart components built on React and SVG',
    clsx: 'Conditional className concatenation utility',
    'tailwind-merge': 'Merges conflicting Tailwind CSS utility classes intelligently',
    express: 'Minimalist web and API routing framework for Node.js',
    cors: 'Cross-Origin Resource Sharing middleware',
    dotenv: 'Loads environment variables from .env files into process.env',
    fastapi: 'Modern, high-performance web framework for Python APIs',
    pydantic: 'Data validation and settings management using Python type hints',
    pytest: 'Framework for writing small and scalable test cases in Python',
  };
  return purposes[name] || `Core dependency providing logic for ${name}`;
}

function categorizeNpmPackage(name: string): string {
  const categories: Record<string, string[]> = {
    Framework: ['react', 'vue', 'angular', 'next', 'nuxt', 'svelte', 'express', 'fastify', 'nestjs'],
    UI: ['tailwindcss', '@mui', '@chakra', 'radix', 'shadcn', 'lucide'],
    Database: ['prisma', 'typeorm', 'mongoose', 'supabase', 'drizzle'],
    Testing: ['jest', 'vitest', 'mocha', 'cypress', 'playwright'],
    'Build Tools': ['webpack', 'vite', 'esbuild', 'rollup', 'turbo', 'tsup'],
    Authentication: ['passport', 'next-auth', 'jsonwebtoken', 'bcrypt', 'auth0'],
    AI: ['@google/generative-ai', 'openai', 'anthropic', 'langchain'],
    Utilities: ['lodash', 'date-fns', 'dayjs', 'uuid', 'zod', 'clsx'],
  };

  const lower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(k => lower.includes(k))) return category;
  }
  return 'General';
}

function categorizePackage(name: string): string {
  return categorizeNpmPackage(name);
}
