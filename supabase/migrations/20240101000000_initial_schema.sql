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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  analysis_status TEXT NOT NULL DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, full_name)
);

-- 3. Repository Files
CREATE TABLE IF NOT EXISTS repository_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES repository_files(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  start_line INT NOT NULL,
  end_line INT NOT NULL,
  embedding vector(768),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. File Relationships
CREATE TABLE IF NOT EXISTS file_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  source_file_id UUID NOT NULL REFERENCES repository_files(id) ON DELETE CASCADE,
  target_file_id UUID NOT NULL REFERENCES repository_files(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  confidence FLOAT NOT NULL DEFAULT 1.0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 6. Repository Insights
CREATE TABLE IF NOT EXISTS repository_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE UNIQUE,
  overview TEXT NOT NULL,
  architecture JSONB NOT NULL DEFAULT '{}'::jsonb,
  detected_technologies JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. File Explanations
CREATE TABLE IF NOT EXISTS file_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES repository_files(id) ON DELETE CASCADE UNIQUE,
  explanation TEXT NOT NULL,
  key_functions JSONB NOT NULL DEFAULT '[]'::jsonb,
  importance TEXT NOT NULL DEFAULT 'supporting',
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Learning Paths
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE UNIQUE,
  roadmap JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Analysis Jobs
CREATE TABLE IF NOT EXISTS analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  current_stage TEXT NOT NULL DEFAULT 'connecting',
  progress INT NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_repo_files_repo_id ON repository_files(repository_id);
CREATE INDEX IF NOT EXISTS idx_repo_files_path ON repository_files(repository_id, file_path);
CREATE INDEX IF NOT EXISTS idx_code_chunks_repo_id ON code_chunks(repository_id);
CREATE INDEX IF NOT EXISTS idx_code_chunks_file_id ON code_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_repo_id ON analysis_jobs(repository_id);

-- Vector Search Function
CREATE OR REPLACE FUNCTION search_code_chunks (
  query_embedding vector(768),
  match_repository_id UUID,
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  repository_id UUID,
  file_id UUID,
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
ALTER TABLE file_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE repository_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Repositories Policies
CREATE POLICY "Users can view own repositories or public" ON repositories FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert own repositories" ON repositories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own repositories" ON repositories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own repositories" ON repositories FOR DELETE USING (auth.uid() = user_id);

-- Repositories Files Policies
CREATE POLICY "Users can view files for accessible repositories" ON repository_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM repositories WHERE id = repository_files.repository_id AND (user_id = auth.uid() OR user_id IS NULL))
);

-- Code Chunks Policies
CREATE POLICY "Users can view code chunks for accessible repositories" ON code_chunks FOR SELECT USING (
  EXISTS (SELECT 1 FROM repositories WHERE id = code_chunks.repository_id AND (user_id = auth.uid() OR user_id IS NULL))
);

-- Conversations Policies
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON conversations FOR DELETE USING (auth.uid() = user_id);

-- Chat Messages Policies
CREATE POLICY "Users can view messages for own conversations" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations WHERE id = chat_messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert messages for own conversations" ON chat_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM conversations WHERE id = chat_messages.conversation_id AND user_id = auth.uid())
);

-- Learning Paths Policies
CREATE POLICY "Users can view own learning paths" ON learning_paths FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own learning paths" ON learning_paths FOR UPDATE USING (auth.uid() = user_id);

