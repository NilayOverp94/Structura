import { NextResponse } from 'next/server';
import { RepositoryStore } from '@/lib/repository/store';
import { synthesizeArchitecture } from '@/lib/analysis/architecture-synthesizer';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const clientKey = request.headers.get('x-gemini-key') || undefined;
    let insights = await RepositoryStore.getInsights(id);

    // If architecture is missing or stuck on the single generic 1-layer fallback
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

    return NextResponse.json({ insights });
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

    return NextResponse.json({ insights, refreshed: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
