import { NextResponse } from 'next/server';
import { DEMO_FILES } from '@/lib/demo-data';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const { id, fileId } = params;

    const file = DEMO_FILES.find(f => f.id === fileId || f.file_path === fileId);
    if (file) {
      return NextResponse.json({ file });
    }

    try {
      const supabase = createServiceRoleClient();
      const { data } = await supabase
        .from('repository_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (data) return NextResponse.json({ file: data });
    } catch {
      // Fallback
    }

    return NextResponse.json({ file: DEMO_FILES[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

