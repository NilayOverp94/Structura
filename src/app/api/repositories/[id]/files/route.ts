import { NextResponse } from 'next/server';
import { DEMO_FILES } from '@/lib/demo-data';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (id === 'demo-codecompass-repo') {
      return NextResponse.json({ files: DEMO_FILES });
    }

    try {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from('repository_files')
        .select('id, file_path, language, file_size, blob_sha')
        .eq('repository_id', id);

      if (error || !data || data.length === 0) {
        return NextResponse.json({ files: DEMO_FILES });
      }

      return NextResponse.json({ files: data });
    } catch {
      return NextResponse.json({ files: DEMO_FILES });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

