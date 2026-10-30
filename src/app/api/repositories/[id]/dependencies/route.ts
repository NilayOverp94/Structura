import { NextResponse } from 'next/server';
import { DEMO_DEPENDENCIES } from '@/lib/demo-data';
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

    if (extracted && extracted.length > 0) {
      return NextResponse.json({ dependencies: extracted });
    }

    return NextResponse.json({ dependencies: DEMO_DEPENDENCIES });
  } catch (error: any) {
    return NextResponse.json({ dependencies: DEMO_DEPENDENCIES });
  }
}
