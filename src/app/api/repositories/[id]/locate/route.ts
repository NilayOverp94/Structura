import { NextResponse } from 'next/server';
import { locateRequestSchema } from '@/lib/validation/github-url';
import { hybridSearch } from '@/lib/rag/search';
import { generateJSON, hasGeminiKey } from '@/lib/gemini/client';
import { LOCATE_PROMPT } from '@/lib/rag/prompts';
import { RepositoryStore } from '@/lib/repository/store';
import { analyzeFile } from '@/lib/analysis/code-analyzer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const validation = locateRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues?.[0]?.message || 'Invalid request' }, { status: 400 });
    }

    const { query } = validation.data;
    const clientKey = request.headers.get('x-gemini-key') || undefined;

    // Search real chunks and files
    const searchResults = await hybridSearch(id, query);
    const files = await RepositoryStore.getFiles(id);

    if (hasGeminiKey(clientKey) && (searchResults.length > 0 || files.length > 0)) {
      try {
        const context = searchResults.length > 0
          ? searchResults.map(r => `File: ${r.file_path}\nSnippet:\n${r.chunk.content.slice(0, 400)}`).join('\n\n')
          : files.slice(0, 10).map(f => `File: ${f.file_path}\n${f.content.slice(0, 300)}`).join('\n\n');

        const prompt = `Query: "${query}"\n\nIndexed Code Context:\n${context}`;
        const structured = await generateJSON<any>(prompt, LOCATE_PROMPT, clientKey);

        if (structured?.results && Array.isArray(structured.results)) {
          // Ensure all results have the recommendation flag
          const formatted = structured.results.map((r: any) => ({
            ...r,
            is_recommendation: true,
          }));
          return NextResponse.json({
            ...structured,
            results: formatted,
          });
        }
      } catch (e) {
        console.warn('Gemini locate fallback:', e);
      }
    }

    // Direct search result mapping with AST symbol enrichment
    if (searchResults.length > 0) {
      const directResults = searchResults.slice(0, 6).map((r, idx) => {
        const matchedFile = files.find(f => f.file_path === r.file_path);
        let functions: string[] = [];
        let related: string[] = [];

        if (matchedFile) {
          const fa = analyzeFile(matchedFile);
          functions = fa.symbols.slice(0, 4).map(s => `${s.name} (${s.kind})`);
          related = fa.imports.filter(i => !i.isExternal).map(i => i.source);
        }

        return {
          file_path: r.file_path,
          relevance: idx === 0 ? 'directly_relevant' : 'related',
          why_relevant: `Matched relevant source code and logic for "${query}".`,
          important_functions: functions,
          related_modules: related.slice(0, 3),
          suggested_order: idx + 1,
          code_snippet: r.chunk.content.slice(0, 250),
          implementation_approach: `Inspect and modify relevant declarations in \`${r.file_path}\`.`,
          potential_risks: [
            `Verify callers importing \`${r.file_path}\` remain compatible.`,
            `Ensure unit tests covering this module are updated.`,
          ],
          is_recommendation: true,
        };
      });

      return NextResponse.json({
        summary: `Located ${directResults.length} matching source files and declarations for "${query}".`,
        implementation_suggestions: `Review files in the suggested inspection order (1 to ${directResults.length}). Verify module boundaries before making changes.`,
        results: directResults,
      });
    }

    return NextResponse.json({
      summary: `No code sections directly matching "${query}" were identified in the indexed files.`,
      results: [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
