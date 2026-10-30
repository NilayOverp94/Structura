import { 
  Repository, 
  RepositoryFile, 
  RepositoryInsights, 
  LearningPath, 
  DependencyInfo,
  LocateResult 
} from '@/types';

export const DEMO_REPOSITORY: Repository = {
  id: 'demo-codecompass-repo',
  user_id: 'demo-user',
  owner: 'structura-ai',
  name: 'structura-core',
  full_name: 'structura-ai/structura-core',
  github_url: 'https://github.com/structura-ai/structura-core',
  description: 'AI-Powered Software Architecture & Repository Intelligence Engine',
  default_branch: 'main',
  primary_language: 'TypeScript',
  stars: 3420,
  forks: 418,
  open_issues: 14,
  indexed_commit_sha: 'a7b8c9d0e1f234567890abcdef1234567890abcd',
  analysis_status: 'completed',
  created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEMO_FILES: RepositoryFile[] = [
  {
    id: 'f-1',
    repository_id: 'demo-codecompass-repo',
    file_path: 'src/index.ts',
    language: 'TypeScript',
    file_size: 1420,
    blob_sha: 'blob-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: `import { createServer } from 'http';
import { createApp } from './app';
import { config } from './config/env';
import { logger } from './utils/logger';

async function bootstrap() {
  const app = createApp();
  const server = createServer(app);

  server.listen(config.port, () => {
    logger.info(\`Structura Core running on port \${config.port}\`);
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal initialization error:', err);
  process.exit(1);
});`,
  },
  {
    id: 'f-2',
    repository_id: 'demo-codecompass-repo',
    file_path: 'src/app.ts',
    language: 'TypeScript',
    file_size: 2150,
    blob_sha: 'blob-2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: `import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { repoRouter } from './routes/repositories';
import { errorHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(rateLimiter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/repos', repoRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}`,
  },
  {
    id: 'f-3',
    repository_id: 'demo-codecompass-repo',
    file_path: 'src/routes/auth.ts',
    language: 'TypeScript',
    file_size: 2840,
    blob_sha: 'blob-3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: `import { Router } from 'express';
import { AuthService } from '../services/auth-service';
import { validateBody } from '../middleware/validation';
import { loginSchema, signupSchema } from '../schemas/auth';

export const authRouter = Router();
const authService = new AuthService();

authRouter.post('/signup', validateBody(signupSchema), async (req, res, next) => {
  try {
    const { email, password, username } = req.body;
    const user = await authService.register(email, password, username);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const session = await authService.login(email, password);
    res.json(session);
  } catch (err) {
    next(err);
  }
});`,
  },
  {
    id: 'f-4',
    repository_id: 'demo-codecompass-repo',
    file_path: 'src/services/auth-service.ts',
    language: 'TypeScript',
    file_size: 3200,
    blob_sha: 'blob-4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: `import { supabaseAdmin } from '../lib/supabase';
import { compare, hash } from 'bcrypt';
import { generateJWT } from '../utils/token';

export class AuthService {
  async register(email: string, passwordHash: string, username: string) {
    const hashedPassword = await hash(passwordHash, 10);
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .insert({ email, username, password_hash: hashedPassword })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return user;
  }

  async login(email: string, passwordPlain: string) {
    const { data: user } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) throw new Error('Invalid credentials');

    const isValid = await compare(passwordPlain, user.password_hash);
    if (!isValid) throw new Error('Invalid credentials');

    const token = generateJWT({ userId: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email, username: user.username } };
  }
}`,
  },
  {
    id: 'f-5',
    repository_id: 'demo-codecompass-repo',
    file_path: 'src/routes/repositories.ts',
    language: 'TypeScript',
    file_size: 3450,
    blob_sha: 'blob-5',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: `import { Router } from 'express';
import { RepoAnalysisService } from '../services/repo-analysis-service';
import { requireAuth } from '../middleware/auth';

export const repoRouter = Router();
const analysisService = new RepoAnalysisService();

repoRouter.use(requireAuth);

repoRouter.post('/analyze', async (req, res, next) => {
  try {
    const { githubUrl } = req.body;
    const job = await analysisService.startAnalysis(req.user.id, githubUrl);
    res.status(202).json({ jobId: job.id, status: job.status });
  } catch (err) {
    next(err);
  }
});

repoRouter.get('/:id/insights', async (req, res, next) => {
  try {
    const insights = await analysisService.getInsights(req.params.id);
    res.json(insights);
  } catch (err) {
    next(err);
  }
});`,
  },
  {
    id: 'f-6',
    repository_id: 'demo-codecompass-repo',
    file_path: 'src/services/repo-analysis-service.ts',
    language: 'TypeScript',
    file_size: 4200,
    blob_sha: 'blob-6',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: `import { GitHubClient } from '../lib/github';
import { GeminiRagEngine } from '../lib/gemini-rag';
import { supabaseAdmin } from '../lib/supabase';

export class RepoAnalysisService {
  private github = new GitHubClient();
  private rag = new GeminiRagEngine();

  async startAnalysis(userId: string, repoUrl: string) {
    const { owner, repo } = this.parseUrl(repoUrl);
    const metadata = await this.github.fetchMetadata(owner, repo);
    const tree = await this.github.fetchFileTree(owner, repo, metadata.defaultBranch);
    
    const validFiles = this.filterSourceFiles(tree);
    const chunks = await this.rag.chunkAndEmbedFiles(validFiles);

    const insights = await this.rag.generateArchitectureInsights(validFiles);
    return { id: metadata.id, status: 'completed', totalFiles: validFiles.length };
  }

  private parseUrl(url: string) {
    const parts = url.replace('https://github.com/', '').split('/');
    return { owner: parts[0], repo: parts[1] };
  }

  private filterSourceFiles(tree: any[]) {
    return tree.filter(t => !t.path.includes('node_modules') && !t.path.startsWith('.'));
  }
}`,
  },
  {
    id: 'f-7',
    repository_id: 'demo-codecompass-repo',
    file_path: 'package.json',
    language: 'JSON',
    file_size: 980,
    blob_sha: 'blob-7',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: `{
  "name": "structura-core",
  "version": "1.0.0",
  "description": "AI-Powered Codebase Navigation Engine",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "bcrypt": "^5.1.1",
    "@supabase/supabase-js": "^2.45.0",
    "@google/generative-ai": "^0.21.0",
    "zod": "^3.23.8",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "typescript": "^5.5.3",
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.9",
    "vitest": "^2.0.0"
  }
}`,
  },
  {
    id: 'f-8',
    repository_id: 'demo-codecompass-repo',
    file_path: 'README.md',
    language: 'Markdown',
    file_size: 1650,
    blob_sha: 'blob-8',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content: `# Structura Core Engine

> Understand Any Codebase.

## Architecture Overview
- **API Server**: Express TypeScript server with REST endpoints.
- **Authentication**: JWT token based authentication with Supabase backend.
- **Analysis Pipeline**: GitHub tree extraction + AST metadata parsing.
- **RAG Engine**: Google Gemini embedding model with pgvector similarity search.

## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\`
`,
  },
];

export const DEMO_INSIGHTS: RepositoryInsights = {
  id: 'insights-1',
  repository_id: 'demo-codecompass-repo',
  overview: 'Structura Core is a production-grade TypeScript backend designed to analyze software repositories, index source files, and extract architecture graphs using Google Gemini AI and Supabase pgvector. It features a clean tiered structure separating HTTP controllers, domain services, and database persistence.',
  architecture: {
    description: 'Tiered Layered Architecture with Express REST handlers, domain service layers, Supabase persistence layer, and Gemini AI RAG pipelines.',
    entry_points: ['src/index.ts', 'src/app.ts'],
    layers: [
      {
        name: 'Entry Points & Bootstrap',
        description: 'Server initialization, process lifecycle management, and port binding.',
        category: 'backend',
        files: ['src/index.ts', 'src/app.ts'],
      },
      {
        name: 'Routing & HTTP API',
        description: 'Express controllers handling authentication and repository analysis endpoints.',
        category: 'api',
        files: ['src/routes/auth.ts', 'src/routes/repositories.ts'],
      },
      {
        name: 'Domain Services',
        description: 'Business logic for user registration, GitHub API ingestion, and AI embedding.',
        category: 'services',
        files: ['src/services/auth-service.ts', 'src/services/repo-analysis-service.ts'],
      },
      {
        name: 'Manifests & Documentation',
        description: 'Project metadata, npm dependencies, and onboarding guides.',
        category: 'config',
        files: ['package.json', 'README.md'],
      },
    ],
  },
  detected_technologies: [
    { name: 'TypeScript', category: 'language', version: '^5.5.3', confidence: 0.99, source: 'package.json' },
    { name: 'Express', category: 'framework', version: '^4.19.2', confidence: 0.98, source: 'package.json' },
    { name: 'Supabase', category: 'service', version: '^2.45.0', confidence: 0.95, source: 'package.json' },
    { name: 'Google Gemini AI', category: 'service', version: '^0.21.0', confidence: 0.95, source: 'package.json' },
    { name: 'Vitest', category: 'tool', version: '^2.0.0', confidence: 0.9, source: 'package.json' },
    { name: 'Zod', category: 'library', version: '^3.23.8', confidence: 0.92, source: 'package.json' },
  ],
  generated_at: new Date().toISOString(),
};

export const DEMO_DEPENDENCIES: DependencyInfo[] = [
  { name: 'express', version: '^4.19.2', type: 'production', category: 'Framework', purpose: 'Core HTTP routing server' },
  { name: '@supabase/supabase-js', version: '^2.45.0', type: 'production', category: 'Database', purpose: 'PostgreSQL database & Auth client' },
  { name: '@google/generative-ai', version: '^0.21.0', type: 'production', category: 'AI', purpose: 'Gemini 1.5 & Embedding SDK' },
  { name: 'zod', version: '^3.23.8', type: 'production', category: 'Utilities', purpose: 'Runtime schema validation' },
  { name: 'bcrypt', version: '^5.1.1', type: 'production', category: 'Authentication', purpose: 'Password hashing and salting' },
  { name: 'jsonwebtoken', version: '^9.0.2', type: 'production', category: 'Authentication', purpose: 'Stateless session JWT generation' },
  { name: 'typescript', version: '^5.5.3', type: 'development', category: 'Build Tools', purpose: 'Static type compilation' },
  { name: 'vitest', version: '^2.0.0', type: 'development', category: 'Testing', purpose: 'Unit testing test runner' },
];

export const DEMO_ROADMAP: LearningPath = {
  id: 'lp-1',
  user_id: 'demo-user',
  repository_id: 'demo-codecompass-repo',
  roadmap: [
    {
      id: 'phase-1',
      phase: 1,
      title: 'Project Genesis & Environment',
      description: 'Get familiar with project goals, dependency topology, and entry points.',
      steps: [
        {
          id: 'step-1-1',
          title: 'Examine Project Manifest & Dependencies',
          explanation: 'Inspect package.json to identify frameworks: Express, Supabase, and Google Gemini AI.',
          relevant_files: ['package.json'],
          why_it_matters: 'Establishes the technology baseline and installed tooling.',
          difficulty: 'beginner',
          completed: true,
        },
        {
          id: 'step-1-2',
          title: 'Read System Architecture in README',
          explanation: 'Review README.md to understand the tiered layout and developer workflow.',
          relevant_files: ['README.md'],
          why_it_matters: 'Provides architectural vision and setup instructions.',
          difficulty: 'beginner',
          completed: true,
        },
      ],
    },
    {
      id: 'phase-2',
      phase: 2,
      title: 'Lifecycle & Application Bootstrap',
      description: 'Trace how HTTP requests enter the system and flow to controllers.',
      steps: [
        {
          id: 'step-2-1',
          title: 'Study Server Bootstrap Sequence',
          explanation: 'Open src/index.ts to see how createServer and createApp initialize runtime ports.',
          relevant_files: ['src/index.ts', 'src/app.ts'],
          why_it_matters: 'Crucial for debugging startup issues and understanding process signals.',
          difficulty: 'beginner',
          completed: false,
        },
        {
          id: 'step-2-2',
          title: 'Trace Middleware and Route Registration',
          explanation: 'Examine src/app.ts where CORS, rate-limiting, and error handlers are mounted.',
          relevant_files: ['src/app.ts'],
          why_it_matters: 'Shows the exact middleware order executed on every API call.',
          difficulty: 'intermediate',
          completed: false,
        },
      ],
    },
    {
      id: 'phase-3',
      phase: 3,
      title: 'Core Business Logic & Repository Analysis',
      description: 'Understand how GitHub data is ingested and embeddings are computed.',
      steps: [
        {
          id: 'step-3-1',
          title: 'Explore Repository Ingestion Service',
          explanation: 'Read src/services/repo-analysis-service.ts to trace GitHub tree fetching.',
          relevant_files: ['src/services/repo-analysis-service.ts'],
          why_it_matters: 'The heart of Structura repository intelligence and analysis logic.',
          difficulty: 'intermediate',
          completed: false,
        },
      ],
    },
    {
      id: 'phase-4',
      phase: 4,
      title: 'Make Your First Contribution',
      description: 'Implement a new health check or repository filter parameter.',
      steps: [
        {
          id: 'step-4-1',
          title: 'Add Extended Metrics to /health endpoint',
          explanation: 'Enhance the health endpoint in src/app.ts to report memory usage and uptime.',
          relevant_files: ['src/app.ts'],
          why_it_matters: 'A low-risk, high-value beginner contribution with instant feedback.',
          difficulty: 'beginner',
          completed: false,
        },
      ],
    },
  ],
  progress: { 'step-1-1': true, 'step-1-2': true },
  updated_at: new Date().toISOString(),
};

export const DEMO_SUGGESTED_QUESTIONS = [
  'How does the application bootstrap and start listening for HTTP requests?',
  'Where is user authentication implemented and what hashing is used?',
  'Explain the overall architecture and main technology layers.',
  'How are GitHub repositories fetched and analyzed?',
  'Where should I add a new API route or endpoint?',
];

export const DEMO_LOCATE_EXAMPLES: { query: string; results: LocateResult[]; summary: string }[] = [
  {
    query: 'Where is user authentication and password validation handled?',
    summary: 'Authentication is orchestrated through Express routes in src/routes/auth.ts and executed inside AuthService (src/services/auth-service.ts) using bcrypt for hashing.',
    results: [
      {
        file_path: 'src/routes/auth.ts',
        relevance: 'directly_relevant',
        why_relevant: 'Declares the /signup and /login POST route handlers and input validation.',
        important_functions: ['authRouter.post(/login)', 'authRouter.post(/signup)'],
        related_modules: ['src/services/auth-service.ts'],
        suggested_order: 1,
        code_snippet: 'authRouter.post(\'/login\', validateBody(loginSchema), async (req, res, next) => { ... })',
      },
      {
        file_path: 'src/services/auth-service.ts',
        relevance: 'directly_relevant',
        why_relevant: 'Performs bcrypt verification and JWT generation against Supabase records.',
        important_functions: ['login(email, passwordPlain)', 'register(email, passwordHash, username)'],
        related_modules: ['src/routes/auth.ts'],
        suggested_order: 2,
        code_snippet: 'const isValid = await compare(passwordPlain, user.password_hash);',
      },
    ],
  },
];

