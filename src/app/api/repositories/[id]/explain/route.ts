import { NextResponse } from 'next/server';
import { generateJSON, hasGeminiKey } from '@/lib/gemini/client';
import { FILE_EXPLANATION_PROMPT, buildExplanationPrompt } from '@/lib/rag/prompts';
import { RepositoryStore } from '@/lib/repository/store';
import { analyzeFile, buildRepositoryDependencyGraph } from '@/lib/analysis/code-analyzer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { filePath, content } = await request.json();

    if (!filePath || !content) {
      return NextResponse.json({ error: 'filePath and content are required' }, { status: 400 });
    }

    const clientKey = request.headers.get('x-gemini-key') || undefined;

    // 1. AST Analysis of the target file
    const fileAnalysis = analyzeFile({
      id: `f-${filePath}`,
      repository_id: id,
      file_path: filePath,
      language: filePath.split('.').pop() || 'text',
      file_size: content.length,
      content,
      blob_sha: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 2. Resolve incoming & outgoing dependencies across the repository
    const allFiles = await RepositoryStore.getFiles(id);
    const depGraph = buildRepositoryDependencyGraph(allFiles);
    const incoming = depGraph.incomingDependencies.get(filePath) || [];
    const outgoing = depGraph.outgoingDependencies.get(filePath) || [];

    let explanation = `\`${filePath}\` defines essential domain logic, exports, and functions for the repository.`;
    let importance = filePath.includes('index') || filePath.includes('app') || filePath.includes('main') ? 'critical' : 'important';
    let roleInProject = `Handles execution and data flow for \`${filePath}\`.`;

    // 3. Gemini Generation with AST Grounding
    if (hasGeminiKey(clientKey)) {
      try {
        const prompt = `${buildExplanationPrompt(filePath, content)}
        
Code AST Context:
- Functions & Classes: ${fileAnalysis.symbols.map(s => `${s.name} (${s.kind} at line ${s.startLine})`).join(', ') || 'None'}
- Incoming Dependencies (Files importing this): ${incoming.join(', ') || 'None'}
- Outgoing Dependencies (Files this imports): ${outgoing.join(', ') || 'None'}
- Environment Variables: ${fileAnalysis.envReferences.join(', ') || 'None'}
- API Routes: ${fileAnalysis.apiRoutes.join(', ') || 'None'}`;

        const explanationData = await generateJSON<any>(prompt, FILE_EXPLANATION_PROMPT, clientKey);
        if (explanationData?.explanation) {
          explanation = explanationData.explanation;
        }
        if (explanationData?.importance) {
          importance = explanationData.importance;
        }
        if (explanationData?.role_in_project) {
          roleInProject = explanationData.role_in_project;
        }
      } catch (err) {
        console.warn('Gemini file explanation failed, using AST-grounded fallback:', err);
      }
    }

    return NextResponse.json({
      explanation,
      importance,
      role_in_project: roleInProject,
      key_functions: fileAnalysis.symbols.slice(0, 10),
      incoming_dependencies: incoming,
      outgoing_dependencies: outgoing,
      env_references: fileAnalysis.envReferences,
      api_routes: fileAnalysis.apiRoutes,
      line_count: fileAnalysis.lineCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
