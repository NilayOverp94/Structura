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

    const clientKey = request.headers.get('x-gemini-key') || undefined;

    // Step 4: AI response
    if (hasGeminiKey(clientKey)) {
      try {
        const prompt = buildChatPrompt(message, context);
        const reply = await generateText(prompt, RAG_SYSTEM_PROMPT, clientKey);
        return NextResponse.json({ reply, citations });
      } catch (err: any) {
        console.warn('Gemini chat failed, using context-grounded fallback:', err);
        return NextResponse.json({
          reply: `I encountered an issue generating a live AI response (${err.message || 'Gemini service error'}).\n\nBased on the indexed codebase files for repository \`${id}\`, here are the relevant code references located for your query:\n\n` +
            (citations.length > 0 
              ? citations.map(c => `- \`${c.file_path}\` (Lines ${c.start_line}–${c.end_line})`).join('\n')
              : 'The indexed source files outline the application entry points, middleware routes, and business services.'),
          citations,
        });
      }
    }

    // Grounded fallback
    const fallbackReply = `Based on the indexed codebase files for repository \`${id}\`:\n\n${
      citations.length > 0 
        ? `Relevant code chunks were located in:\n` + citations.map(c => `- \`${c.file_path}\` (Lines ${c.start_line}–${c.end_line})`).join('\n')
        : 'The indexed source files outline the application entry points, middleware routes, and business services.'
    }\n\nTo enable live generative responses with streaming context, set \`GEMINI_API_KEY\` in your environment or paste your key in Structura Settings > Code Intelligence.`;

    return NextResponse.json({
      reply: fallbackReply,
      citations: citations.slice(0, 4),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
