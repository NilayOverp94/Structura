import { NextResponse } from 'next/server';
import { RepositoryStore } from '@/lib/repository/store';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const files = await RepositoryStore.getFiles(id);
    return NextResponse.json(
      { files },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
