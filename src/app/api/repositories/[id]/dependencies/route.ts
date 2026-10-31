import { NextResponse } from 'next/server';
import { RepositoryStore } from '@/lib/repository/store';
import { extractDependencies } from '@/lib/analysis/dependency-analyzer';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const files = await RepositoryStore.getFiles(id);
    const extracted = extractDependencies(files);

    return NextResponse.json(
      { dependencies: extracted || [] },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch (error: any) {
    return NextResponse.json({ dependencies: [] });
  }
}
