import { NextResponse } from 'next/server';
import { DEMO_REPOSITORY } from '@/lib/demo-data';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (id === 'demo-codecompass-repo') {
      return NextResponse.json({ repository: DEMO_REPOSITORY });
    }

    try {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return NextResponse.json({ repository: DEMO_REPOSITORY });
      }

      return NextResponse.json({ repository: data });
    } catch {
      return NextResponse.json({ repository: DEMO_REPOSITORY });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

