-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Repositories
CREATE TABLE IF NOT EXISTS repositories (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  github_url TEXT NOT NULL,
  description TEXT,
  default_branch TEXT NOT NULL DEFAULT 'main',
  primary_language TEXT,
  stars INT DEFAULT 0,
  forks INT DEFAULT 0,
  open_issues INT DEFAULT 0,
  indexed_commit_sha TEXT,
  analysis_status TEXT NOT NULL DEFAULT 'completed' CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Repository Files
CREATE TABLE IF NOT EXISTS repository_files (
  id TEXT PRIMARY KEY,
  repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  language TEXT,
  file_size INT NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  blob_sha TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(repository_id, file_path)
);

-- 4. Code Chunks with Vector Embeddings
CREATE TABLE IF NOT EXISTS code_chunks (
  id TEXT PRIMARY KEY,
  repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  file_id TEXT REFERENCES repository_files(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  start_line INT NOT NULL,
  end_line INT NOT NULL,
  embedding vector(768),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Repository Insights
CREATE TABLE IF NOT EXISTS repository_insights (
  id TEXT PRIMARY KEY,
  repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE UNIQUE,
  overview TEXT NOT NULL,
  architecture JSONB NOT NULL DEFAULT '{}'::jsonb,
  detected_technologies JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. File Explanations
CREATE TABLE IF NOT EXISTS file_explanations (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL REFERENCES repository_files(id) ON DELETE CASCADE UNIQUE,
  explanation TEXT NOT NULL,
  key_functions JSONB NOT NULL DEFAULT '[]'::jsonb,
  importance TEXT NOT NULL DEFAULT 'supporting',
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Learning Paths
CREATE TABLE IF NOT EXISTS learning_paths (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE UNIQUE,
  roadmap JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_repositories_owner_name ON repositories(owner, name);
CREATE INDEX IF NOT EXISTS idx_repositories_full_name ON repositories(full_name);
CREATE INDEX IF NOT EXISTS idx_repository_files_repo_id ON repository_files(repository_id);
CREATE INDEX IF NOT EXISTS idx_code_chunks_repo_id ON code_chunks(repository_id);

-- Vector Search Function
CREATE OR REPLACE FUNCTION search_code_chunks (
  query_embedding vector(768),
  match_repository_id TEXT,
  match_threshold FLOAT DEFAULT 0.2,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  repository_id TEXT,
  file_id TEXT,
  chunk_index INT,
  content TEXT,
  start_line INT,
  end_line INT,
  metadata JSONB,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.repository_id,
    c.file_id,
    c.chunk_index,
    c.content,
    c.start_line,
    c.end_line,
    c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity,
    c.created_at
  FROM code_chunks c
  WHERE c.repository_id = match_repository_id
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE repository_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE repository_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Repositories Policies (Allow public or owner viewing, service role has full access)
CREATE POLICY "Repositories are viewable by everyone" ON repositories FOR SELECT USING (true);
CREATE POLICY "Users can insert repositories" ON repositories FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own repositories" ON repositories FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Repositories Files Policies
CREATE POLICY "Repository files are viewable by everyone" ON repository_files FOR SELECT USING (true);
CREATE POLICY "Users can insert files" ON repository_files FOR INSERT WITH CHECK (true);

-- Code Chunks Policies
CREATE POLICY "Code chunks viewable by everyone" ON code_chunks FOR SELECT USING (true);
CREATE POLICY "Users can insert code chunks" ON code_chunks FOR INSERT WITH CHECK (true);

-- Insights Policies
CREATE POLICY "Insights viewable by everyone" ON repository_insights FOR SELECT USING (true);
CREATE POLICY "Users can insert insights" ON repository_insights FOR INSERT WITH CHECK (true);

-- Conversations Policies
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert own conversations" ON conversations FOR INSERT WITH CHECK (true);

-- Chat Messages Policies
CREATE POLICY "Users can view messages for own conversations" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can insert messages" ON chat_messages FOR INSERT WITH CHECK (true);

-- Learning Paths Policies
CREATE POLICY "Users can view learning paths" ON learning_paths FOR SELECT USING (true);
CREATE POLICY "Users can update learning paths" ON learning_paths FOR UPDATE USING (true);
