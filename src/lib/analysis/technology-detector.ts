import { DetectedTechnology } from '@/types';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  engines?: Record<string, string>;
}

export function detectTechnologies(files: { path: string; content: string }[]): DetectedTechnology[] {
  const technologies: DetectedTechnology[] = [];
  const seen = new Set<string>();

  const add = (tech: Omit<DetectedTechnology, 'confidence'> & { confidence?: number }) => {
    if (seen.has(tech.name)) return;
    seen.add(tech.name);
    technologies.push({ confidence: 0.95, ...tech });
  };

  for (const file of files) {
    const fileName = file.path.split('/').pop()?.toLowerCase() || '';
    
    // Node.js & Javascript ecosystem
    if (fileName === 'package.json') {
      try {
        const pkg: PackageJson = JSON.parse(file.content);
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

        if (allDeps['next']) add({ name: 'Next.js', category: 'framework', version: allDeps['next'], source: file.path });
        if (allDeps['react']) add({ name: 'React', category: 'framework', version: allDeps['react'], source: file.path });
        if (allDeps['vue']) add({ name: 'Vue.js', category: 'framework', version: allDeps['vue'], source: file.path });
        if (allDeps['angular'] || allDeps['@angular/core']) add({ name: 'Angular', category: 'framework', version: allDeps['@angular/core'], source: file.path });
        if (allDeps['svelte']) add({ name: 'Svelte', category: 'framework', version: allDeps['svelte'], source: file.path });
        if (allDeps['express']) add({ name: 'Express', category: 'framework', version: allDeps['express'], source: file.path });
        if (allDeps['fastify']) add({ name: 'Fastify', category: 'framework', version: allDeps['fastify'], source: file.path });
        if (allDeps['nestjs'] || allDeps['@nestjs/core']) add({ name: 'NestJS', category: 'framework', version: allDeps['@nestjs/core'], source: file.path });
        if (allDeps['tailwindcss']) add({ name: 'Tailwind CSS', category: 'library', version: allDeps['tailwindcss'], source: file.path });
        if (allDeps['prisma'] || allDeps['@prisma/client']) add({ name: 'Prisma', category: 'database', version: allDeps['@prisma/client'], source: file.path });
        if (allDeps['mongoose']) add({ name: 'Mongoose', category: 'database', version: allDeps['mongoose'], source: file.path });
        if (allDeps['@supabase/supabase-js']) add({ name: 'Supabase', category: 'service', version: allDeps['@supabase/supabase-js'], source: file.path });
        if (allDeps['firebase'] || allDeps['firebase-admin']) add({ name: 'Firebase', category: 'service', source: file.path });
        if (allDeps['typescript']) add({ name: 'TypeScript', category: 'language', version: allDeps['typescript'], source: file.path });
        if (allDeps['jest'] || allDeps['vitest'] || allDeps['mocha']) {
          const testFramework = allDeps['jest'] ? 'Jest' : allDeps['vitest'] ? 'Vitest' : 'Mocha';
          add({ name: testFramework, category: 'tool', source: file.path });
        }
        if (allDeps['webpack']) add({ name: 'Webpack', category: 'tool', source: file.path });
        if (allDeps['vite']) add({ name: 'Vite', category: 'tool', source: file.path });
        if (allDeps['esbuild']) add({ name: 'esbuild', category: 'tool', source: file.path });
        if (allDeps['reactflow']) add({ name: 'React Flow', category: 'library', source: file.path });
        if (allDeps['@google/generative-ai']) add({ name: 'Google Gemini AI', category: 'service', source: file.path });

        if (pkg.engines?.node) add({ name: 'Node.js', category: 'runtime', version: pkg.engines.node, source: file.path });
      } catch {
        // Continue
      }
    }

    // Python ecosystem
    if (fileName === 'requirements.txt' || fileName === 'pyproject.toml' || fileName === 'setup.py') {
      add({ name: 'Python', category: 'language', source: file.path });
      if (file.content.includes('django')) add({ name: 'Django', category: 'framework', source: file.path });
      if (file.content.includes('flask')) add({ name: 'Flask', category: 'framework', source: file.path });
      if (file.content.includes('fastapi')) add({ name: 'FastAPI', category: 'framework', source: file.path });
      if (file.content.includes('sqlalchemy')) add({ name: 'SQLAlchemy', category: 'database', source: file.path });
      if (file.content.includes('pydantic')) add({ name: 'Pydantic', category: 'library', source: file.path });
    }

    // Go ecosystem
    if (fileName === 'go.mod') {
      add({ name: 'Go', category: 'language', source: file.path });
      if (file.content.includes('gin-gonic')) add({ name: 'Gin', category: 'framework', source: file.path });
      if (file.content.includes('fiber')) add({ name: 'Fiber', category: 'framework', source: file.path });
    }

    // Rust ecosystem
    if (fileName === 'cargo.toml') {
      add({ name: 'Rust', category: 'language', source: file.path });
      if (file.content.includes('actix')) add({ name: 'Actix', category: 'framework', source: file.path });
      if (file.content.includes('tokio')) add({ name: 'Tokio', category: 'runtime', source: file.path });
      if (file.content.includes('axum')) add({ name: 'Axum', category: 'framework', source: file.path });
    }

    // Docker / Containers
    if (fileName === 'dockerfile' || fileName.includes('docker-compose')) {
      add({ name: 'Docker', category: 'tool', source: file.path });
    }
  }

  return technologies.sort((a, b) => b.confidence - a.confidence);
}

