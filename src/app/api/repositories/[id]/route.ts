import { NextResponse } from 'next/server';
import { DEMO_REPOSITORY } from '@/lib/demo-data';
import { RepositoryStore } from '@/lib/repository/store';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const repository = await RepositoryStore.getRepository(id);
    if (repository) {
      return NextResponse.json({ repository });
    }

    return NextResponse.json({ repository: DEMO_REPOSITORY });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
