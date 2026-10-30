import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.exchangeCodeForSession(code);
    } catch (e) {
      console.error('Error exchanging code for session:', e);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

