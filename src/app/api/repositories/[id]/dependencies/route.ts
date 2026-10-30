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

    return NextResponse.json({ dependencies: extracted || [] });
  } catch (error: any) {
    return NextResponse.json({ dependencies: [] });
  }
}
