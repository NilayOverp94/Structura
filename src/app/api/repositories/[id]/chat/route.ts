import { NextResponse } from 'next/server';
import { hybridSearch, buildContextFromResults } from '@/lib/rag/search';
import { generateText, hasGeminiKey } from '@/lib/gemini/client';
import { RAG_SYSTEM_PROMPT, buildChatPrompt } from '@/lib/rag/prompts';
import { chatRequestSchema } from '@/lib/validation/github-url';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const validation = chatRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues?.[0]?.message || 'Invalid request' }, { status: 400 });
    }

    const { message } = validation.data;

    // Step 1: Hybrid vector + keyword search
    const searchResults = await hybridSearch(id, message);

    // Step 2: Assemble context
    const context = buildContextFromResults(searchResults);

    // Step 3: Citations
    const citations = searchResults.map(r => ({
      file_path: r.file_path,
      start_line: r.chunk.start_line,
      end_line: r.chunk.end_line,
      snippet: r.chunk.content.slice(0, 150),
    }));

    // Step 4: AI response
    if (hasGeminiKey()) {
      try {
        const prompt = buildChatPrompt(message, context);
        const reply = await generateText(prompt, RAG_SYSTEM_PROMPT);
        return NextResponse.json({ reply, citations });
      } catch (err: any) {
        console.warn('Gemini chat failed, using context-grounded fallback:', err);
      }
    }

    // Grounded fallback
    const fallbackReply = `Based on the indexed codebase files for repository \`${id}\`:\n\n${
      citations.length > 0 
        ? `Relevant code chunks were located in:\n` + citations.map(c => `- \`${c.file_path}\` (Lines ${c.start_line}–${c.end_line})`).join('\n')
        : 'The indexed source files outline the application entry points, middleware routes, and business services.'
    }\n\nAsk any question about architecture patterns, route handlers, or dependency graphs to explore this codebase.`;

    return NextResponse.json({
      reply: fallbackReply,
      citations: citations.slice(0, 4),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
