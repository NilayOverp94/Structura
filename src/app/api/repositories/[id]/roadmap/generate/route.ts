import { NextResponse } from 'next/server';
import { DEMO_ROADMAP } from '@/lib/demo-data';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ roadmap: DEMO_ROADMAP.roadmap });
}

