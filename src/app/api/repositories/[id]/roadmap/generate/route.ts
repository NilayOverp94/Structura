import { NextResponse } from 'next/server';
import { RepositoryStore } from '@/lib/repository/store';
import { generateJSON, hasGeminiKey } from '@/lib/gemini/client';
import { ROADMAP_PROMPT } from '@/lib/rag/prompts';
import { RoadmapPhase } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const repo = await RepositoryStore.getRepository(id);
    const files = await RepositoryStore.getFiles(id);

    if (hasGeminiKey() && files.length > 0) {
      try {
        const fileList = files.slice(0, 20).map(f => f.file_path).join('\n');
        const prompt = `Repository: ${repo?.full_name || id}\nDescription: ${repo?.description || 'N/A'}\nPrimary Language: ${repo?.primary_language || 'TypeScript'}\n\nAvailable Repository Files:\n${fileList}`;
        const roadmapData = await generateJSON<any>(prompt, ROADMAP_PROMPT);

        if (roadmapData?.phases && Array.isArray(roadmapData.phases)) {
          return NextResponse.json({ roadmap: roadmapData.phases });
        }
      } catch (geminiErr) {
        console.warn('Gemini roadmap generation fallback:', geminiErr);
      }
    }

    // Synthesize structured roadmap from real files
    const readmeFile = files.find(f => f.file_path.toLowerCase().includes('readme'));
    const entryFile = files.find(f => f.file_path.includes('index') || f.file_path.includes('main') || f.file_path.includes('app'));
    const configFiles = files.filter(f => f.file_path.endsWith('.json') || f.file_path.endsWith('.config.js') || f.file_path.endsWith('.toml'));

    const synthesizedPhases: RoadmapPhase[] = [
      {
        id: 'phase-1',
        phase: 1,
        title: 'Phase 1: Project Setup & Mental Model',
        description: 'Understand the purpose, installation requirements, and developer environment setup.',
        steps: [
          {
            id: 'step-1-1',
            title: 'Read Documentation & Project Goals',
            explanation: readmeFile ? `Review ${readmeFile.file_path} to understand project goals and usage.` : 'Examine repository README and root package manifest.',
            why_it_matters: 'Provides high-level context before diving into implementation details.',
            relevant_files: readmeFile ? [readmeFile.file_path] : [],
            difficulty: 'beginner',
            completed: false,
          },
          {
            id: 'step-1-2',
            title: 'Inspect Configuration & Build Manifests',
            explanation: 'Understand toolchain requirements, dependencies, and build scripts.',
            why_it_matters: 'Ensures you can reproduce local builds and run linters reliably.',
            relevant_files: configFiles.slice(0, 3).map(f => f.file_path),
            difficulty: 'beginner',
            completed: false,
          },
        ],
      },
      {
        id: 'phase-2',
        phase: 2,
        title: 'Phase 2: Core Architecture & Control Flow',
        description: 'Trace primary entry points, service handlers, and data structures.',
        steps: [
          {
            id: 'step-2-1',
            title: 'Explore Application Entry Points',
            explanation: entryFile ? `Inspect ${entryFile.file_path} to trace execution bootstrap and routing.` : 'Trace the top-level execution flow.',
            why_it_matters: 'Helps locate where execution initiates and how services are mounted.',
            relevant_files: entryFile ? [entryFile.file_path] : files.slice(0, 2).map(f => f.file_path),
            difficulty: 'intermediate',
            completed: false,
          },
          {
            id: 'step-2-2',
            title: 'Trace Internal Module Relationships',
            explanation: 'Navigate core business logic, utility classes, and helper libraries.',
            why_it_matters: 'Reveals how data is transformed across architectural boundaries.',
            relevant_files: files.slice(2, 6).map(f => f.file_path),
            difficulty: 'intermediate',
            completed: false,
          },
        ],
      },
      {
        id: 'phase-3',
        phase: 3,
        title: 'Phase 3: Making Your First Contribution',
        description: 'Identify first issues, write tests, and submit a pull request.',
        steps: [
          {
            id: 'step-3-1',
            title: 'Run Tests & Local Validation',
            explanation: 'Run project unit tests and linters to verify the test harness.',
            why_it_matters: 'Guarantees your changes do not break existing behavior.',
            relevant_files: files.filter(f => f.file_path.includes('test') || f.file_path.includes('spec')).map(f => f.file_path),
            difficulty: 'intermediate',
            completed: false,
          },
          {
            id: 'step-3-2',
            title: 'Tackle Good First Issues',
            explanation: 'Pick an open bug, improve documentation, or add unit test coverage.',
            why_it_matters: 'Easiest path to gaining reviewer trust and landing your first PR.',
            relevant_files: [],
            difficulty: 'beginner',
            completed: false,
          },
        ],
      },
    ];

    return NextResponse.json({ roadmap: synthesizedPhases });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
