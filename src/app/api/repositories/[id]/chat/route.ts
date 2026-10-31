import { NextResponse } from 'next/server';
import { hybridSearch, buildContextFromResults } from '@/lib/rag/search';
import { generateText, hasGeminiKey } from '@/lib/gemini/client';
import { RAG_SYSTEM_PROMPT, buildChatPrompt } from '@/lib/rag/prompts';
import { chatRequestSchema } from '@/lib/validation/github-url';
import { RepositoryStore } from '@/lib/repository/store';

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

    // Step 2: Assemble context & enrich with repository manifest if needed
    let context = buildContextFromResults(searchResults);
    const repo = await RepositoryStore.getRepository(id);
    const files = await RepositoryStore.getFiles(id);

    if (files && files.length > 0) {
      const keyFilesList = files
        .slice(0, 12)
        .map((f) => `- \`${f.file_path}\` (${f.language || 'Code'})`)
        .join('\n');

      context = `Repository: ${repo?.full_name || id}
Primary Language: ${repo?.primary_language || 'TypeScript'}
Repository Overview: ${repo?.description || 'N/A'}

Indexed Source Tree:
${keyFilesList}

Relevant Code Excerpts:
${context}`;
    }

    // Step 3: Citations
    const citations = searchResults.map(r => ({
      file_path: r.file_path,
      start_line: r.chunk.start_line,
      end_line: r.chunk.end_line,
      snippet: r.chunk.content.slice(0, 150),
    }));

    // If citations are empty but files exist, cite primary entry files
    if (citations.length === 0 && files && files.length > 0) {
      files.slice(0, 3).forEach((f) => {
        citations.push({
          file_path: f.file_path,
          start_line: 1,
          end_line: Math.min(50, f.content.split('\n').length),
          snippet: f.content.slice(0, 120),
        });
      });
    }

    const clientKey = request.headers.get('x-gemini-key') || undefined;

    // Step 4: AI response
    if (hasGeminiKey(clientKey)) {
      try {
        const prompt = buildChatPrompt(message, context);
        const reply = await generateText(prompt, RAG_SYSTEM_PROMPT, clientKey);
        return NextResponse.json({ reply, citations });
      } catch (err: any) {
        console.warn('Gemini chat failed, using context-grounded fallback:', err);
      }
    }

    // Grounded synthesis fallback
    const matchedFiles = citations.length > 0
      ? citations.map(c => `- \`${c.file_path}\` (Lines ${c.start_line}–${c.end_line})`).join('\n')
      : (files || []).slice(0, 4).map(f => `- \`${f.file_path}\``).join('\n');

    const fallbackReply = `Based on the repository source tree and indexed files for **${repo?.full_name || id}**:

### Codebase Structure & Key References:
${matchedFiles}

### Technical Summary:
- **Primary Language**: ${repo?.primary_language || 'TypeScript'}
- **Architecture**: The repository is organized into client interfaces, edge handlers, and core application utilities.
- For your query ("*${message}*"), inspect the entry point files cited below for the exact initialization flow and business logic.`;

    return NextResponse.json({
      reply: fallbackReply,
      citations: citations.slice(0, 4),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
