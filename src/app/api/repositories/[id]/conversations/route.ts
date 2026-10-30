import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({
    conversations: [
      {
        id: 'conv-1',
        title: 'Initial Architecture Inquiries',
        created_at: new Date().toISOString(),
      },
    ],
  });
}

