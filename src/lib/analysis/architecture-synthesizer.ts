import { Repository, RepositoryFile, RepositoryInsights } from '@/types';
import { generateJSON, hasGeminiKey } from '@/lib/gemini/client';
import { ARCHITECTURE_PROMPT } from '@/lib/rag/prompts';
import { RepositoryStore } from '@/lib/repository/store';

export function buildModularArchitecture(
  repoName: string,
  files: RepositoryFile[]
): RepositoryInsights['architecture']['layers'] {
  const frontendFiles: string[] = [];
  const apiFiles: string[] = [];
  const serviceFiles: string[] = [];
  const databaseFiles: string[] = [];
  const configFiles: string[] = [];

  for (const file of files) {
    const p = file.file_path.toLowerCase();
    if (
      p.includes('supabase/functions') || 
      p.includes('/api/') || 
      p.includes('route.') || 
      p.includes('controller') ||
      p.includes('endpoint')
    ) {
      apiFiles.push(file.file_path);
    } else if (
      p.endsWith('.html') || 
      p.includes('src/app') || 
      p.includes('src/components') || 
      p.includes('views') || 
      p.includes('styles') || 
      p.endsWith('.css') || 
      p.includes('app.tsx') || 
      p.includes('main.tsx') ||
      p.includes('pages')
    ) {
      frontendFiles.push(file.file_path);
    } else if (
      p.includes('/lib/') || 
      p.includes('/services/') || 
      p.includes('/utils/') || 
      p.includes('/mcp/') || 
      p.includes('helper') ||
      p.includes('core')
    ) {
      serviceFiles.push(file.file_path);
    } else if (
      p.includes('db') || 
      p.includes('schema') || 
      p.includes('model') || 
      p.includes('prisma') || 
      p.includes('supabase') ||
      p.includes('migration')
    ) {
      databaseFiles.push(file.file_path);
    } else if (
      p.endsWith('.json') || 
      p.includes('config') || 
      p.includes('.toml') || 
      p.endsWith('.config.ts') || 
      p.endsWith('.config.js')
    ) {
      configFiles.push(file.file_path);
    } else {
      serviceFiles.push(file.file_path);
    }
  }

  const layers: RepositoryInsights['architecture']['layers'] = [];

  // 1. Client Interface & UI
  layers.push({
    name: 'Client Interface & UI',
    description: 'Interactive views, layout structures, user event handling, and presentation components.',
    category: 'frontend',
    files: frontendFiles.length > 0 ? frontendFiles.slice(0, 10) : ['src/App.tsx', 'index.html'],
  });

  // 2. API Routes & Edge Functions
  layers.push({
    name: 'API Routes & Edge Handlers',
    description: 'Serverless functions, API routes, request routing, and external webhooks.',
    category: 'api',
    files: apiFiles.length > 0 ? apiFiles.slice(0, 10) : ['src/app/api', 'supabase/functions'],
  });

  // 3. Core Services & Logic
  layers.push({
    name: 'Core Services & Utilities',
    description: 'Business domain services, shared helpers, data transformers, and runtime SDK clients.',
    category: 'services',
    files: serviceFiles.length > 0 ? serviceFiles.slice(0, 10) : ['src/lib', 'src/services'],
  });

  // 4. Data & Persistence Layer (if present or relevant)
  if (databaseFiles.length > 0 || files.some(f => f.file_path.toLowerCase().includes('supabase'))) {
    layers.push({
      name: 'Data & Persistence Layer',
      description: 'Relational tables, vector embeddings, cloud datastores, and cache definitions.',
      category: 'database',
      files: databaseFiles.length > 0 ? databaseFiles.slice(0, 10) : ['supabase/config.toml'],
    });
  }

  // 5. Build & Configuration
  if (configFiles.length > 0) {
    layers.push({
      name: 'Build & Project Configuration',
      description: 'Package dependencies, bundler toolchains, TypeScript types, and environment presets.',
      category: 'config',
      files: configFiles.slice(0, 8),
    });
  }

  return layers;
}

export async function synthesizeArchitecture(
  repoId: string,
  clientKey?: string
): Promise<RepositoryInsights['architecture']> {
  const repo = await RepositoryStore.getRepository(repoId);
  const files = await RepositoryStore.getFiles(repoId);

  // 1. Try Gemini AI synthesis with active key
  if (hasGeminiKey(clientKey) && files && files.length > 0) {
    try {
      const summaryFiles = files
        .slice(0, 20)
        .map((f) => `File: ${f.file_path}\n${f.content.slice(0, 350)}`)
        .join('\n\n');

      const prompt = `Repository: ${repo?.full_name || repoId}\nDescription: ${
        repo?.description || 'N/A'
      }\nPrimary Language: ${repo?.primary_language || 'TypeScript'}\n\nKey Files:\n${summaryFiles}`;

      const aiInsights = await generateJSON<any>(prompt, ARCHITECTURE_PROMPT, clientKey);
      if (
        aiInsights?.architecture?.layers &&
        Array.isArray(aiInsights.architecture.layers) &&
        aiInsights.architecture.layers.length >= 2
      ) {
        return {
          description: aiInsights.architecture.description || `Architecture pattern for ${repo?.full_name || repoId}`,
          entry_points: aiInsights.architecture.entry_points || files.slice(0, 4).map((f) => f.file_path),
          layers: aiInsights.architecture.layers,
        };
      }
    } catch (err) {
      console.warn('Gemini architecture synthesis failed, using modular rule breakdown:', err);
    }
  }

  // 2. Intelligent rule-based categorization based on actual repository tree
  const layers = buildModularArchitecture(repo?.full_name || repoId, files || []);

  const entryPoints = (files || [])
    .filter((f) => {
      const p = f.file_path.toLowerCase();
      return p.includes('main') || p.includes('index') || p.includes('app') || p.endsWith('.html');
    })
    .slice(0, 4)
    .map((f) => f.file_path);

  return {
    description: `Modular architecture for ${repo?.full_name || repoId}`,
    entry_points: entryPoints.length > 0 ? entryPoints : ['src/index.ts', 'index.html'],
    layers,
  };
}

