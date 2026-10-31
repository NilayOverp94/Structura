import { NextResponse } from 'next/server';
import { RepositoryStore } from '@/lib/repository/store';
import { synthesizeArchitecture } from '@/lib/analysis/architecture-synthesizer';
import { buildRepositoryDependencyGraph } from '@/lib/analysis/code-analyzer';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const clientKey = request.headers.get('x-gemini-key') || undefined;
    let insights = await RepositoryStore.getInsights(id);
    const files = await RepositoryStore.getFiles(id);

    if (
      !insights ||
      !insights.architecture?.layers ||
      insights.architecture.layers.length <= 1
    ) {
      const architecture = await synthesizeArchitecture(id, clientKey);
      if (!insights) {
        insights = {
          id: `insights-${id}`,
          repository_id: id,
          overview: `Architecture graph and module boundaries for repository ${id}.`,
          architecture,
          detected_technologies: [],
          generated_at: new Date().toISOString(),
        };
      } else {
        insights.architecture = architecture;
      }
    }

    // Build verified graph from actual file imports and exports
    const depGraph = buildRepositoryDependencyGraph(files);
    
    // Module nodes grouped by architecture layer
    const confirmedEdges = depGraph.confirmedEdges.map((e, idx) => ({
      id: `confirmed-edge-${idx}`,
      source: e.source,
      target: e.target,
      label: 'imports',
      explanation: `\`${e.source}\` imports symbols from \`${e.target}\``,
      is_confirmed: true,
    }));

    return NextResponse.json({ 
      insights,
      graph: {
        confirmedEdges,
        totalModules: depGraph.modules.size,
        totalConfirmedImports: depGraph.confirmedEdges.length,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const clientKey = request.headers.get('x-gemini-key') || undefined;
    const architecture = await synthesizeArchitecture(id, clientKey);
    const files = await RepositoryStore.getFiles(id);

    let insights = await RepositoryStore.getInsights(id);
    if (!insights) {
      insights = {
        id: `insights-${id}`,
        repository_id: id,
        overview: `Architecture graph and module boundaries for repository ${id}.`,
        architecture,
        detected_technologies: [],
        generated_at: new Date().toISOString(),
      };
    } else {
      insights.architecture = architecture;
    }

    const depGraph = buildRepositoryDependencyGraph(files);
    const confirmedEdges = depGraph.confirmedEdges.map((e, idx) => ({
      id: `confirmed-edge-${idx}`,
      source: e.source,
      target: e.target,
      label: 'imports',
      explanation: `\`${e.source}\` imports symbols from \`${e.target}\``,
      is_confirmed: true,
    }));

    return NextResponse.json({ 
      insights, 
      graph: {
        confirmedEdges,
        totalModules: depGraph.modules.size,
        totalConfirmedImports: depGraph.confirmedEdges.length,
      },
      refreshed: true 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
