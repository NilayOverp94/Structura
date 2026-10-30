import { NextResponse } from 'next/server';
import { RepositoryStore } from '@/lib/repository/store';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const { id, fileId } = params;
    const file = await RepositoryStore.getFile(id, fileId);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json({ file });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
