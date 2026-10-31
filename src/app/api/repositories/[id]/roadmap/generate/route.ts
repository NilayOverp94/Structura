import { NextResponse } from 'next/server';
import { RepositoryStore } from '@/lib/repository/store';
import { generateJSON, hasGeminiKey } from '@/lib/gemini/client';
import { ROADMAP_PROMPT } from '@/lib/rag/prompts';
import { RoadmapPhase } from '@/types';
import { analyzeFile } from '@/lib/analysis/code-analyzer';

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
    const clientKey = request.headers.get('x-gemini-key') || undefined;

    // Detect specialized files
    const readmeFile = files.find(f => f.file_path.toLowerCase().includes('readme'));
    const entryFile = files.find(f => f.file_path.includes('index') || f.file_path.includes('main') || f.file_path.includes('app'));
    const configFiles = files.filter(f => f.file_path.endsWith('.json') || f.file_path.endsWith('.config.js') || f.file_path.endsWith('.toml'));
    const authFiles = files.filter(f => f.file_path.toLowerCase().includes('auth') || f.file_path.toLowerCase().includes('login') || f.file_path.toLowerCase().includes('session'));
    const apiFiles = files.filter(f => f.file_path.includes('/api/') || f.file_path.includes('route.') || f.file_path.includes('functions'));
    const dbFiles = files.filter(f => f.file_path.toLowerCase().includes('schema') || f.file_path.toLowerCase().includes('model') || f.file_path.toLowerCase().includes('supabase') || f.file_path.toLowerCase().includes('prisma'));
    const testFiles = files.filter(f => f.file_path.toLowerCase().includes('test') || f.file_path.toLowerCase().includes('spec'));

    if (hasGeminiKey(clientKey) && files.length > 0) {
      try {
        const fileList = files.slice(0, 30).map(f => f.file_path).join('\n');
        const prompt = `Repository: ${repo?.full_name || id}
Description: ${repo?.description || 'N/A'}
Primary Language: ${repo?.primary_language || 'TypeScript'}

Key Files:
${fileList}

Generate a comprehensive 10-point contributor onboarding roadmap with 4 phases that covers:
1. Project overview
2. Technology stack
3. Application entry points
4. Core architecture
5. Important modules
6. Database and API structure
7. Authentication and authorization flow
8. Important dependencies
9. Suggested first files to study
10. Beginner-friendly contribution tasks

Each step MUST link to actual files from the list above and include an explanation of why the developer should study them.`;

        const roadmapData = await generateJSON<any>(prompt, ROADMAP_PROMPT, clientKey);

        if (roadmapData?.phases && Array.isArray(roadmapData.phases) && roadmapData.phases.length >= 3) {
          return NextResponse.json({ roadmap: roadmapData.phases });
        }
      } catch (geminiErr) {
        console.warn('Gemini roadmap generation fallback:', geminiErr);
      }
    }

    // Comprehensive 10-point deterministic synthesis from actual codebase files
    const synthesizedPhases: RoadmapPhase[] = [
      {
        id: 'phase-1',
        phase: 1,
        title: 'Phase 1: Project Overview & Technology Stack',
        description: 'Understand the application purpose, runtime requirements, and build manifests.',
        steps: [
          {
            id: 'step-1-1',
            title: '1. Project Overview & Mission',
            explanation: readmeFile 
              ? `Review \`${readmeFile.file_path}\` to understand the product domain, core features, and prerequisites.` 
              : 'Inspect repository root documentation to establish high-level conceptual understanding.',
            why_it_matters: 'Establishes the mental model before reading implementation code.',
            relevant_files: readmeFile ? [readmeFile.file_path] : [],
            difficulty: 'beginner',
            completed: false,
          },
          {
            id: 'step-1-2',
            title: '2. Technology Stack & Manifests',
            explanation: `Review build manifests (${configFiles.slice(0, 2).map(f => f.file_path).join(', ') || 'root config'}) to examine dependencies, scripts, and runtime engines.`,
            why_it_matters: 'Allows you to reproduce local builds and run test suites reliably.',
            relevant_files: configFiles.slice(0, 3).map(f => f.file_path),
            difficulty: 'beginner',
            completed: false,
          },
          {
            id: 'step-1-3',
            title: '3. Application Entry Points',
            explanation: entryFile 
              ? `Examine \`${entryFile.file_path}\` where execution initializes and server/client handlers mount.` 
              : 'Trace the main initialization file where root execution starts.',
            why_it_matters: 'Identifies where control flow begins and how lifecycle handlers start.',
            relevant_files: entryFile ? [entryFile.file_path] : files.slice(0, 2).map(f => f.file_path),
            difficulty: 'beginner',
            completed: false,
          },
        ],
      },
      {
        id: 'phase-2',
        phase: 2,
        title: 'Phase 2: Architecture, Modules & Boundaries',
        description: 'Navigate internal layers, component boundaries, and domain logic separation.',
        steps: [
          {
            id: 'step-2-1',
            title: '4. Core Architecture & Layer Flow',
            explanation: 'Trace data flow across client presentation, middleware guards, and background tasks.',
            why_it_matters: 'Prevents architectural violations when adding new capabilities.',
            relevant_files: files.slice(0, 3).map(f => f.file_path),
            difficulty: 'intermediate',
            completed: false,
          },
          {
            id: 'step-2-2',
            title: '5. Important Modules & Utilities',
            explanation: 'Explore shared utilities, helper algorithms, and client wrappers in the service directory.',
            why_it_matters: 'Reusing existing internal utilities prevents redundant code duplication.',
            relevant_files: files.filter(f => f.file_path.includes('/lib/') || f.file_path.includes('/utils/') || f.file_path.includes('/services/')).slice(0, 4).map(f => f.file_path),
            difficulty: 'intermediate',
            completed: false,
          },
        ],
      },
      {
        id: 'phase-3',
        phase: 3,
        title: 'Phase 3: Data, APIs & Authentication',
        description: 'Understand backend contracts, database persistence, and session security.',
        steps: [
          {
            id: 'step-3-1',
            title: '6. Database & API Structure',
            explanation: `Review API routes (${apiFiles.slice(0, 2).map(f => f.file_path).join(', ') || 'serverless handlers'}) and schemas (${dbFiles.slice(0, 2).map(f => f.file_path).join(', ') || 'tables'}).`,
            why_it_matters: 'Critical for constructing correct API payloads and querying the database without breaking constraints.',
            relevant_files: [...apiFiles.slice(0, 2), ...dbFiles.slice(0, 2)].map(f => f.file_path),
            difficulty: 'intermediate',
            completed: false,
          },
          {
            id: 'step-3-2',
            title: '7. Authentication & Authorization Flow',
            explanation: authFiles.length > 0 
              ? `Inspect \`${authFiles.map(f => f.file_path).join(', ')}\` to trace identity verification, tokens, and protected routes.`
              : 'Inspect session and security middleware protecting user requests.',
            why_it_matters: 'Ensures contributions do not introduce authorization bypasses or security flaws.',
            relevant_files: authFiles.slice(0, 3).map(f => f.file_path),
            difficulty: 'intermediate',
            completed: false,
          },
          {
            id: 'step-3-3',
            title: '8. Key Dependencies & External SDKs',
            explanation: 'Inspect major third-party libraries and SDK wrappers integrated into the codebase.',
            why_it_matters: 'Ensures understanding of vendor contracts, rate limits, and client SDK conventions.',
            relevant_files: configFiles.slice(0, 2).map(f => f.file_path),
            difficulty: 'intermediate',
            completed: false,
          },
        ],
      },
      {
        id: 'phase-4',
        phase: 4,
        title: 'Phase 4: Hands-on Contributions & Testing',
        description: 'Recommended first files to study and safe beginner-friendly contribution opportunities.',
        steps: [
          {
            id: 'step-4-1',
            title: '9. Suggested First Files to Study',
            explanation: `Dive into ${files.slice(1, 4).map(f => `\`${f.file_path}\``).join(', ')} as self-contained reference implementations.`,
            why_it_matters: 'Provides clean reference patterns for idiomatic code conventions in this repository.',
            relevant_files: files.slice(1, 4).map(f => f.file_path),
            difficulty: 'beginner',
            completed: false,
          },
          {
            id: 'step-4-2',
            title: '10. Beginner-Friendly Contribution Tasks',
            explanation: testFiles.length > 0
              ? `Write edge-case unit tests in \`${testFiles[0].file_path}\`, refine error handling, or improve inline documentation.`
              : 'Add unit tests for helper functions, enhance input validation error messages, or update documentation.',
            why_it_matters: 'The safest, highest-leverage way to submit your first merged pull request.',
            relevant_files: testFiles.slice(0, 2).map(f => f.file_path),
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
