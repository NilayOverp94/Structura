export interface Repository {
  id: string;
  user_id: string;
  owner: string;
  name: string;
  full_name: string;
  github_url: string;
  description: string | null;
  default_branch: string;
  primary_language: string | null;
  stars: number;
  forks: number;
  open_issues: number;
  indexed_commit_sha: string | null;
  analysis_status: AnalysisStatus;
  created_at: string;
  updated_at: string;
}

export type AnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'failed';

export interface RepositoryFile {
  id: string;
  repository_id: string;
  file_path: string;
  language: string | null;
  file_size: number;
  content: string;
  blob_sha: string | null;
  created_at: string;
  updated_at: string;
}

export interface CodeChunk {
  id: string;
  repository_id: string;
  file_id: string;
  chunk_index: number;
  content: string;
  start_line: number;
  end_line: number;
  embedding: number[] | null;
  metadata: ChunkMetadata;
  created_at: string;
}

export interface ChunkMetadata {
  file_path: string;
  language: string | null;
  functions?: string[];
  classes?: string[];
  imports?: string[];
}

export interface FileRelationship {
  id: string;
  repository_id: string;
  source_file_id: string;
  target_file_id: string;
  relationship_type: 'imports' | 'exports' | 'references' | 'extends' | 'implements';
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface RepositoryInsights {
  id: string;
  repository_id: string;
  overview: string;
  architecture: ArchitectureData;
  detected_technologies: DetectedTechnology[];
  generated_at: string;
}

export interface ArchitectureData {
  layers: ArchitectureLayer[];
  entry_points: string[];
  description: string;
}

export interface ArchitectureLayer {
  name: string;
  description: string;
  files: string[];
  category: 'frontend' | 'backend' | 'api' | 'database' | 'auth' | 'services' | 'utilities' | 'tests' | 'infrastructure' | 'config' | 'docs';
}

export interface DetectedTechnology {
  name: string;
  category: 'framework' | 'library' | 'language' | 'tool' | 'service' | 'database' | 'runtime';
  version?: string;
  confidence: number;
  source: string;
}

export interface FileExplanation {
  id: string;
  file_id: string;
  explanation: string;
  key_functions: FunctionInfo[];
  importance: 'critical' | 'important' | 'supporting' | 'utility';
  generated_at: string;
}

export interface FunctionInfo {
  name: string;
  line: number;
  description: string;
  parameters?: string[];
  returns?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  repository_id: string;
  title: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  created_at: string;
}

export interface Citation {
  file_path: string;
  start_line: number;
  end_line: number;
  snippet: string;
}

export interface LearningPath {
  id: string;
  user_id: string;
  repository_id: string;
  roadmap: RoadmapPhase[];
  progress: Record<string, boolean>;
  updated_at: string;
}

export interface RoadmapPhase {
  id: string;
  phase: number;
  title: string;
  description: string;
  steps: RoadmapStep[];
}

export interface RoadmapStep {
  id: string;
  title: string;
  explanation: string;
  relevant_files: string[];
  why_it_matters: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completed: boolean;
}

export interface AnalysisJob {
  id: string;
  repository_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  current_stage: string;
  progress: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocateResult {
  file_path: string;
  relevance: 'directly_relevant' | 'related' | 'potentially_relevant';
  why_relevant: string;
  important_functions: string[];
  related_modules: string[];
  suggested_order: number;
  code_snippet?: string;
  implementation_approach?: string;
  potential_risks?: string[];
  is_recommendation?: boolean;
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development';
  purpose?: string;
  used_in?: string[];
  category?: string;
  ecosystem?: string;
  is_declared?: boolean;
}

export interface GitHubRepoMeta {
  name: string;
  owner: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  language: string | null;
  stars: number;
  forks: number;
  open_issues: number;
  created_at: string;
  updated_at: string;
  license: string | null;
  topics: string[];
  size: number;
  html_url: string;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface SearchResult {
  chunk: CodeChunk;
  similarity: number;
  file_path: string;
}
