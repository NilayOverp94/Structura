export const APP_CONFIG = {
  name: 'Structura',
  tagline: 'Understand Any Codebase',
  description: 'AI-powered repository intelligence platform that helps developers explore architecture, understand unfamiliar codebases, and contribute faster.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://structura-eosin.vercel.app',
  brandColors: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    background: '#0F172A',
    text: '#64748B',
    border: '#E2E8F0',
  },
} as const;

export const GITHUB_CONFIG = {
  apiBase: 'https://api.github.com',
  allowedHosts: ['github.com', 'api.github.com'],
  maxFileSize: 500_000, // 500KB per file
  maxRepoFiles: 500,
  maxTreeDepth: 10,
  rateLimitBuffer: 100,
  excludedDirs: [
    'node_modules', '.git', 'dist', 'build', '.next', 'coverage',
    'vendor', '__pycache__', '.cache', '.turbo', '.vercel',
    'target', 'out', '.output', 'tmp', '.tmp',
  ],
  excludedFiles: [
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    'composer.lock', 'Gemfile.lock', 'Cargo.lock', 'poetry.lock',
  ],
  excludedExtensions: [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp',
    '.mp4', '.mp3', '.wav', '.avi', '.mov', '.flv',
    '.zip', '.tar', '.gz', '.rar', '.7z',
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.exe', '.dll', '.so', '.dylib', '.bin',
    '.pyc', '.pyo', '.class', '.o', '.obj',
    '.min.js', '.min.css', '.bundle.js', '.chunk.js',
    '.map',
  ],
  sensitivePatterns: [
    /\.env/i, /\.pem$/i, /\.key$/i, /\.cert$/i,
    /id_rsa/i, /id_dsa/i, /id_ecdsa/i, /id_ed25519/i,
    /\.secret/i, /credentials/i, /\.p12$/i, /\.pfx$/i,
  ],
} as const;

export const GEMINI_CONFIG = {
  model: process.env.GEMINI_MODEL && process.env.GEMINI_MODEL !== 'gemini-1.5-flash'
    ? process.env.GEMINI_MODEL 
    : 'gemini-2.5-flash',
  embeddingModel: process.env.GEMINI_EMBEDDING_MODEL && process.env.GEMINI_EMBEDDING_MODEL !== 'text-embedding-004'
    ? process.env.GEMINI_EMBEDDING_MODEL 
    : 'gemini-embedding-001',
  maxTokens: 8192,
  temperature: 0.3,
  chunkSize: 1500,
  chunkOverlap: 200,
  maxChunksPerQuery: 15,
  embeddingDimensions: 768,
} as const;

export const ANALYSIS_STAGES = [
  { key: 'connecting', label: 'Connecting to GitHub', weight: 5 },
  { key: 'fetching_metadata', label: 'Fetching repository metadata', weight: 5 },
  { key: 'fetching_tree', label: 'Fetching repository structure', weight: 10 },
  { key: 'fetching_files', label: 'Reading source files', weight: 30 },
  { key: 'analyzing', label: 'Analyzing code structure', weight: 10 },
  { key: 'generating_embeddings', label: 'Generating embeddings', weight: 25 },
  { key: 'generating_insights', label: 'Building architecture insights', weight: 10 },
  { key: 'finalizing', label: 'Preparing repository workspace', weight: 5 },
] as const;

export type AnalysisStage = typeof ANALYSIS_STAGES[number]['key'];

export const LANGUAGE_MAP: Record<string, string> = {
  ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript',
  py: 'Python', rb: 'Ruby', java: 'Java', kt: 'Kotlin', swift: 'Swift',
  go: 'Go', rs: 'Rust', cpp: 'C++', c: 'C', cs: 'C#', php: 'PHP',
  dart: 'Dart', scala: 'Scala', r: 'R', lua: 'Lua', zig: 'Zig',
  html: 'HTML', css: 'CSS', scss: 'SCSS', less: 'Less',
  json: 'JSON', yaml: 'YAML', yml: 'YAML', toml: 'TOML', xml: 'XML',
  md: 'Markdown', mdx: 'MDX', txt: 'Text',
  sql: 'SQL', graphql: 'GraphQL', proto: 'Protocol Buffers',
  sh: 'Shell', bash: 'Shell', zsh: 'Shell', fish: 'Shell',
  dockerfile: 'Dockerfile', makefile: 'Makefile',
  vue: 'Vue', svelte: 'Svelte', astro: 'Astro',
};

export const FILE_ICONS: Record<string, string> = {
  TypeScript: '🔷', JavaScript: '🟨', Python: '🐍', Ruby: '💎',
  Java: '☕', Go: '🔵', Rust: '🦀', 'C++': '⚙️', C: '⚙️',
  HTML: '🌐', CSS: '🎨', JSON: '📋', YAML: '📋', Markdown: '📝',
  Shell: '🖥️', Dockerfile: '🐳', SQL: '🗃️', default: '📄',
};
