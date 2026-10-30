import { describe, it, expect } from 'vitest';
import { parseGitHubUrl, githubUrlSchema } from '../src/lib/validation/github-url';
import { filterRepositoryFiles, detectLanguage } from '../src/lib/github/filter';
import { chunkFileContent } from '../src/lib/analysis/chunker';
import { detectTechnologies } from '../src/lib/analysis/technology-detector';

describe('GitHub URL Validation', () => {
  it('correctly parses valid GitHub repository URLs', () => {
    const parsed = parseGitHubUrl('https://github.com/facebook/react');
    expect(parsed).toEqual({ owner: 'facebook', repo: 'react' });

    const parsedWithSlash = parseGitHubUrl('https://github.com/vercel/next.js/');
    expect(parsedWithSlash).toEqual({ owner: 'vercel', repo: 'next.js' });
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

