import { NextResponse } from 'next/server';
import { DEMO_DEPENDENCIES } from '@/lib/demo-data';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ dependencies: DEMO_DEPENDENCIES });
}

