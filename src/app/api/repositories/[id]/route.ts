import { NextResponse } from 'next/server';
import { RepositoryStore } from '@/lib/repository/store';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const repository = await RepositoryStore.getRepository(id);
    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    return NextResponse.json({ repository });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
