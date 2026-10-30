import { NextResponse } from 'next/server';
import { DEMO_INSIGHTS } from '@/lib/demo-data';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (id === 'demo-codecompass-repo') {
      return NextResponse.json({ insights: DEMO_INSIGHTS });
    }

    try {
      const supabase = createServiceRoleClient();
      const { data } = await supabase
        .from('repository_insights')
        .select('*')
        .eq('repository_id', id)
        .single();

      if (data) return NextResponse.json({ insights: data });
    } catch {
      // Fallback
    }

    return NextResponse.json({ insights: DEMO_INSIGHTS });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

