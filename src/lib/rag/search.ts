import { GEMINI_CONFIG } from '@/config/constants';
import { generateEmbedding, hasGeminiKey } from '@/lib/gemini/client';
import { SearchResult, CodeChunk } from '@/types';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function semanticSearch(
  repositoryId: string,
  query: string,
  limit: number = GEMINI_CONFIG.maxChunksPerQuery
): Promise<SearchResult[]> {
  try {
    const supabase = createServiceRoleClient();
    const queryEmbedding = await generateEmbedding(query);

    const { data, error } = await supabase.rpc('search_code_chunks', {
      query_embedding: queryEmbedding,
      match_repository_id: repositoryId,
      match_threshold: 0.2,
      match_count: limit,
    });

    if (error) {
      console.warn('Supabase vector RPC fallback to content matching:', error.message);
      return fallbackKeywordSearch(repositoryId, query, limit);
    }

    return (data || []).map((item: any) => ({
      chunk: {
        id: item.id,
        repository_id: item.repository_id,
        file_id: item.file_id,
        chunk_index: item.chunk_index,
        content: item.content,
        start_line: item.start_line,
        end_line: item.end_line,
        embedding: null,
        metadata: item.metadata,
        created_at: item.created_at,
      },
      similarity: item.similarity || 0.85,
      file_path: item.metadata?.file_path || '',
    }));
  } catch (error) {
    console.warn('Semantic search error, using fallback:', error);
    return fallbackKeywordSearch(repositoryId, query, limit);
  }
}

export async function fallbackKeywordSearch(
  repositoryId: string,
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  try {
    const supabase = createServiceRoleClient();
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);

    const { data, error } = await supabase
      .from('code_chunks')
      .select('*')
      .eq('repository_id', repositoryId)
      .limit(50);

    if (error || !data) return [];

    const scored = data.map((chunk: any) => {
      let score = 0;
      const contentLower = chunk.content.toLowerCase();
      const pathLower = (chunk.metadata?.file_path || '').toLowerCase();

      for (const kw of keywords) {
        if (pathLower.includes(kw)) score += 3;
        if (contentLower.includes(kw)) score += 1;
      }

      return {
        chunk: chunk as CodeChunk,
        similarity: Math.min(score / (keywords.length * 2 || 1), 0.99),
        file_path: chunk.metadata?.file_path || '',
      };
    });

    return scored
      .filter(s => s.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function hybridSearch(
  repositoryId: string,
  query: string
): Promise<SearchResult[]> {
  const semanticResults = await semanticSearch(repositoryId, query, GEMINI_CONFIG.maxChunksPerQuery);
  if (semanticResults.length > 0) return semanticResults;
  return fallbackKeywordSearch(repositoryId, query, GEMINI_CONFIG.maxChunksPerQuery);
}

export function buildContextFromResults(results: SearchResult[]): string {
  if (results.length === 0) return 'No directly matching code excerpts found in indexed files.';

  const contextParts = results.map((result, index) => {
    const { chunk, file_path, similarity } = result;
    return [
      `### Source ${index + 1}: \`${file_path}\` (Lines ${chunk.start_line}-${chunk.end_line}) [Relevance: ${(similarity * 100).toFixed(0)}%]`,
      '```',
      chunk.content,
      '```',
    ].join('\n');
  });

  return contextParts.join('\n\n');
}

