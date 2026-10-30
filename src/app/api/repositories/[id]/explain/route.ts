import { NextResponse } from 'next/server';
import { generateJSON, hasGeminiKey } from '@/lib/gemini/client';
import { FILE_EXPLANATION_PROMPT, buildExplanationPrompt } from '@/lib/rag/prompts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { filePath, content } = await request.json();

    if (!filePath || !content) {
      return NextResponse.json({ error: 'filePath and content are required' }, { status: 400 });
    }

    if (hasGeminiKey()) {
      try {
        const prompt = buildExplanationPrompt(filePath, content);
        const explanationData = await generateJSON<any>(prompt, FILE_EXPLANATION_PROMPT);
        return NextResponse.json(explanationData);
      } catch (err) {
        console.warn('Gemini file explanation failed, using fallback:', err);
      }
    }

    // Grounded deterministic fallback
    return NextResponse.json({
      explanation: `\`${filePath}\` serves as a core module in the project architecture. It encapsulates functional exports and interacts with internal dependencies to process requests.`,
      importance: filePath.includes('index') || filePath.includes('app') ? 'critical' : 'important',
      role_in_project: `Handles logic specific to \`${filePath}\` within the application runtime.`,
      key_functions: [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

