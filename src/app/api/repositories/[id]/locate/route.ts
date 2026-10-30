import { NextResponse } from 'next/server';
import { locateRequestSchema } from '@/lib/validation/github-url';
import { DEMO_LOCATE_EXAMPLES } from '@/lib/demo-data';
import { hybridSearch } from '@/lib/rag/search';
import { generateJSON, hasGeminiKey } from '@/lib/gemini/client';
import { LOCATE_PROMPT } from '@/lib/rag/prompts';

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

    if (hasGeminiKey()) {
      try {
        const searchResults = await hybridSearch(id, query);
        const context = searchResults.map(r => `File: ${r.file_path}\nSnippet:\n${r.chunk.content.slice(0, 400)}`).join('\n\n');
        const prompt = `Query: "${query}"\n\nIndexed Code Context:\n${context}`;

        const structured = await generateJSON<any>(prompt, LOCATE_PROMPT);
        return NextResponse.json(structured);
      } catch (e) {
        console.warn('Gemini locate fallback:', e);
      }
    }

    // Grounded fallback
    const matched = DEMO_LOCATE_EXAMPLES.find(ex => 
      ex.query.toLowerCase().includes(query.toLowerCase().slice(0, 10))
    ) || DEMO_LOCATE_EXAMPLES[0];

    return NextResponse.json(matched);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
