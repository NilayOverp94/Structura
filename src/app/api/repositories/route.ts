import { NextResponse } from 'next/server';
import { RepositoryStore } from '@/lib/repository/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const repositories = await RepositoryStore.listRepositories();
    return NextResponse.json(
      { repositories },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

