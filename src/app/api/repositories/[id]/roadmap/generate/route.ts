import { NextResponse } from 'next/server';
import { DEMO_ROADMAP } from '@/lib/demo-data';
import { RepositoryStore } from '@/lib/repository/store';
import { generateJSON, hasGeminiKey } from '@/lib/gemini/client';
import { ROADMAP_PROMPT } from '@/lib/rag/prompts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (id !== 'demo-codecompass-repo' && hasGeminiKey()) {
      try {
        const repo = await RepositoryStore.getRepository(id);
        const files = await RepositoryStore.getFiles(id);
        const fileList = files.slice(0, 20).map(f => f.file_path).join('\n');

        const prompt = `Repository: ${repo?.full_name || id}\nDescription: ${repo?.description || 'N/A'}\n\nAvailable Repository Files:\n${fileList}`;
        const roadmapData = await generateJSON<any>(prompt, ROADMAP_PROMPT);

        if (roadmapData?.phases && Array.isArray(roadmapData.phases)) {
          return NextResponse.json({ roadmap: roadmapData.phases });
        }
      } catch (geminiErr) {
        console.warn('Gemini roadmap generation fallback:', geminiErr);
      }
    }

    return NextResponse.json({ roadmap: DEMO_ROADMAP.roadmap });
  } catch (error: any) {
    return NextResponse.json({ roadmap: DEMO_ROADMAP.roadmap });
  }
}
