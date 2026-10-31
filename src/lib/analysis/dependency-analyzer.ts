import { DependencyInfo, RepositoryFile } from '@/types';

export function extractDependencies(files: RepositoryFile[]): DependencyInfo[] {
  const dependencies: DependencyInfo[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    const fileName = file.file_path.split('/').pop()?.toLowerCase() || '';

    if (fileName === 'package.json') {
      dependencies.push(...extractNpmDependencies(file.content, seen));
    } else if (fileName === 'requirements.txt') {
      dependencies.push(...extractPipDependencies(file.content, seen));
    } else if (fileName === 'go.mod') {
      dependencies.push(...extractGoDependencies(file.content, seen));
    } else if (fileName === 'cargo.toml') {
      dependencies.push(...extractCargoDependencies(file.content, seen));
    }
  }

  return dependencies;
}

function extractNpmDependencies(content: string, seen: Set<string>): DependencyInfo[] {
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
            category: categorizeNpmPackage(name),
            purpose: getPackagePurpose(name),
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
            category: categorizeNpmPackage(name),
            purpose: getPackagePurpose(name),
          });
        }
      }
    }
  } catch {
    // Ignore JSON parse error
  }
  return deps;
}

function getPackagePurpose(name: string): string {
  const purposes: Record<string, string> = {
    react: 'Core declarative UI library for rendering components',
    'react-dom': 'DOM rendering backend for React',
    next: 'Full-stack React framework with SSR and file-based routing',
    tailwindcss: 'Utility-first CSS styling framework',
    typescript: 'Static type checking for JavaScript',
    '@supabase/supabase-js': 'Supabase PostgreSQL database & Auth client',
    '@google/generative-ai': 'Official SDK for Gemini AI and embedding models',
    zod: 'TypeScript-first schema validation and parsing',
    'lucide-react': 'Developer-oriented icon library',
    reactflow: 'Interactive node-based graph and workflow diagrams',
    'framer-motion': 'Production-ready motion and animation engine',
    recharts: 'Composable charting library built on React components',
    clsx: 'Utility for constructing className strings conditionally',
    'tailwind-merge': 'Merges Tailwind CSS classes without conflict',
  };
  return purposes[name] || `Package dependency for ${name}`;
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

function extractPipDependencies(content: string, seen: Set<string>): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) continue;
    
    const match = trimmed.match(/^([a-zA-Z0-9_\-.]+)(?:[><=!~]+(.+))?/);
    if (match && !seen.has(match[1])) {
      seen.add(match[1]);
      deps.push({
        name: match[1],
        version: match[2] || '*',
        type: 'production',
        category: 'Python',
        purpose: `Python dependency ${match[1]}`,
      });
    }
  }
  return deps;
}

function extractGoDependencies(content: string, seen: Set<string>): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  const requireBlock = content.match(/require\s*\(([\s\S]*?)\)/);
  if (requireBlock) {
    const lines = requireBlock[1].split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^(\S+)\s+(\S+)/);
      if (match && !seen.has(match[1])) {
        seen.add(match[1]);
        deps.push({ name: match[1], version: match[2], type: 'production', category: 'Go', purpose: `Go module ${match[1]}` });
      }
    }
  }
  return deps;
}

function extractCargoDependencies(content: string, seen: Set<string>): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  const depSection = content.match(/\[dependencies\]([\s\S]*?)(?:\[|$)/);
  if (depSection) {
    const lines = depSection[1].split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^([a-zA-Z0-9_\-]+)\s*=\s*"?([^"\s]+)"?/);
      if (match && !seen.has(match[1])) {
        seen.add(match[1]);
        deps.push({ name: match[1], version: match[2], type: 'production', category: 'Rust', purpose: `Cargo crate ${match[1]}` });
      }
    }
  }
  return deps;
}
