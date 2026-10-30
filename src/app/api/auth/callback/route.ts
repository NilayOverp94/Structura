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

  // Optimize origin for Vercel deployments and custom domains
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocal = process.env.NODE_ENV === 'development';
  let origin = requestUrl.origin;

  if (!isLocal && forwardedHost) {
    origin = `https://${forwardedHost}`;
  } else if (process.env.NEXT_PUBLIC_APP_URL) {
    origin = process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  }

  return NextResponse.redirect(new URL(next, origin));
}
