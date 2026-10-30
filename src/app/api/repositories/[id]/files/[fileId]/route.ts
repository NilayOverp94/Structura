import { NextResponse } from 'next/server';
import { RepositoryStore } from '@/lib/repository/store';
import { DEMO_FILES } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const { id, fileId } = params;
    const file = await RepositoryStore.getFile(id, fileId);

    if (file) {
      return NextResponse.json({ file });
    }

    return NextResponse.json({ file: DEMO_FILES[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
