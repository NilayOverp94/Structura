import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({
    status: 'completed',
    progress: 100,
    current_stage: 'finalizing',
  });
}

