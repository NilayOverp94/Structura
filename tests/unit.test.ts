import { describe, it, expect } from 'vitest';
import { parseGitHubUrl, githubUrlSchema } from '../src/lib/validation/github-url';
import { filterRepositoryFiles, detectLanguage } from '../src/lib/github/filter';
import { chunkFileContent } from '../src/lib/analysis/chunker';
import { detectTechnologies } from '../src/lib/analysis/technology-detector';
import { analyzeCodeFile, buildRepositoryDependencyGraph } from '../src/lib/analysis/code-analyzer';
import { extractDependencies } from '../src/lib/analysis/dependency-analyzer';

describe('GitHub URL Validation', () => {
  it('correctly parses valid GitHub repository URLs', () => {
    const parsed = parseGitHubUrl('https://github.com/facebook/react');
    expect(parsed).toEqual({ owner: 'facebook', repo: 'react', branch: undefined });

    const parsedWithSlash = parseGitHubUrl('https://github.com/vercel/next.js/');
    expect(parsedWithSlash).toEqual({ owner: 'vercel', repo: 'next.js', branch: undefined });

    const parsedWithGit = parseGitHubUrl('https://github.com/vercel/next.js.git');
    expect(parsedWithGit).toEqual({ owner: 'vercel', repo: 'next.js', branch: undefined });

    const parsedWithBranch = parseGitHubUrl('https://github.com/torvalds/linux/tree/v6.8');
    expect(parsedWithBranch).toEqual({ owner: 'torvalds', repo: 'linux', branch: 'v6.8' });
  });

  it('rejects invalid or non-GitHub URLs', () => {
    expect(parseGitHubUrl('https://gitlab.com/owner/repo')).toBeNull();
    expect(parseGitHubUrl('not-a-url')).toBeNull();
    expect(parseGitHubUrl('https://github.com/invalid')).toBeNull();
  });
});

describe('File Filtering and Language Detection', () => {
  it('filters out excluded folders and sensitive files', () => {
    const items = [
      { path: 'src/index.ts', type: 'blob' as const, sha: '1', url: '', mode: '100644' },
      { path: 'node_modules/react/index.js', type: 'blob' as const, sha: '2', url: '', mode: '100644' },
      { path: '.env', type: 'blob' as const, sha: '3', url: '', mode: '100644' },
      { path: 'dist/bundle.js', type: 'blob' as const, sha: '4', url: '', mode: '100644' },
    ];
    const filtered = filterRepositoryFiles(items);
    expect(filtered.length).toBe(1);
    expect(filtered[0].path).toBe('src/index.ts');
  });

  it('accurately identifies file programming languages', () => {
    expect(detectLanguage('src/app.tsx')).toBe('TypeScript');
    expect(detectLanguage('server/main.py')).toBe('Python');
    expect(detectLanguage('Dockerfile')).toBe('Dockerfile');
    expect(detectLanguage('lib/module.go')).toBe('Go');
    expect(detectLanguage('src/lib.rs')).toBe('Rust');
  });
});

describe('Code Chunker and AST Metadata Extraction', () => {
  it('chunks small code files in a single chunk with function metadata', () => {
    const code = `function calculateTotal(price: number, tax: number) {\n  return price + tax;\n}`;
    const chunks = chunkFileContent(code, 'src/math.ts', 'TypeScript');
    expect(chunks.length).toBe(1);
    expect(chunks[0].startLine).toBe(1);
    expect(chunks[0].endLine).toBe(3);
    expect(chunks[0].metadata.functions).toContain('calculateTotal');
  });
});

describe('AST & Dependency Graph Analyzer', () => {
  it('extracts imports, functions, classes and layer classification', () => {
    const code = `
import { createClient } from '@/lib/supabase/client';
import express from 'express';

export class AuthService {
  async authenticateUser(token: string) {
    return token ? true : false;
  }
}
export const hashPassword = (pwd: string) => pwd;
`;
    const analysis = analyzeCodeFile('src/services/auth.ts', code);
    const importSources = analysis.imports.map(i => i.source);
    const symbolNames = analysis.symbols.map(s => s.name);

    expect(importSources).toContain('@/lib/supabase/client');
    expect(importSources).toContain('express');
    expect(symbolNames).toContain('AuthService');
    expect(symbolNames).toContain('authenticateUser');
    expect(symbolNames).toContain('hashPassword');
    expect(analysis.layer).toBe('services');
  });

  it('builds repository dependency graph with confirmed edges', () => {
    const files = [
      {
        path: 'src/components/Header.tsx',
        content: `import { AuthService } from '../services/auth';\nexport function Header() {}`,
      },
      {
        path: 'src/services/auth.ts',
        content: `export class AuthService {}`,
      }
    ];
    const graph = buildRepositoryDependencyGraph(files);
    expect(graph.files.size).toBe(2);
    expect(graph.confirmedEdges.length).toBeGreaterThan(0);
    expect(graph.confirmedEdges[0]).toEqual({
      source: 'src/components/Header.tsx',
      target: 'src/services/auth.ts',
      type: 'import',
    });
    expect(graph.outgoingDependencies.get('src/components/Header.tsx')).toContain('src/services/auth.ts');
  });
});

describe('Multi-Manifest Dependency Analyzer', () => {
  it('extracts dependencies from requirements.txt, go.mod, and Cargo.toml', () => {
    const files = [
      {
        path: 'requirements.txt',
        content: 'fastapi==0.110.0\npydantic>=2.0.0\nuvicorn\n',
      },
      {
        path: 'go.mod',
        content: 'module github.com/user/demo\n\ngo 1.21\n\nrequire (\n\tgithub.com/gin-gonic/gin v1.9.1\n\tgorm.io/gorm v1.25.7\n)',
      },
      {
        path: 'Cargo.toml',
        content: '[package]\nname = "rust-demo"\n\n[dependencies]\ntokio = { version = "1.0", features = ["full"] }\nserde = "1.0"\n',
      }
    ];

    const deps = extractDependencies(files);
    const names = deps.map(d => d.name);

    expect(names).toContain('fastapi');
    expect(names).toContain('pydantic');
    expect(names).toContain('github.com/gin-gonic/gin');
    expect(names).toContain('tokio');
    expect(names).toContain('serde');
  });
});

describe('Technology Detector', () => {
  it('detects Next.js and Supabase from package.json', () => {
    const packageJsonContent = JSON.stringify({
      dependencies: {
        next: '^14.2.0',
        react: '^18.2.0',
        '@supabase/supabase-js': '^2.40.0',
      },
    });

    const detected = detectTechnologies([
      { path: 'package.json', content: packageJsonContent },
    ]);

    const names = detected.map(d => d.name);
    expect(names).toContain('Next.js');
    expect(names).toContain('React');
    expect(names).toContain('Supabase');
  });
});

