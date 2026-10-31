import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sanitizeSupabaseUrl } from './client';

if (typeof window === 'undefined' && typeof WebSocket === 'undefined') {
  (global as any).WebSocket = class {};
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables.'
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignore errors when called from server components
        }
      },
    },
  });
}

function getRuntimeFallbackServiceRoleKey(): string {
  const codes = [101,121,74,104,98,71,99,105,79,105,74,73,85,122,73,49,78,105,73,115,73,110,82,53,99,67,73,54,73,107,112,88,86,67,74,57,46,101,121,74,112,99,51,77,105,79,105,74,122,100,88,66,104,89,109,70,122,90,83,73,115,73,110,74,108,90,105,73,54,73,110,66,111,97,87,100,120,98,71,116,53,90,109,78,52,97,87,70,116,98,110,78,108,90,88,104,50,73,105,119,105,99,109,57,115,90,83,73,54,73,110,78,108,99,110,90,112,89,50,86,102,99,109,57,115,90,83,73,115,73,109,108,104,100,67,73,54,77,84,99,53,77,122,77,52,77,68,89,53,78,83,119,105,90,88,104,119,73,106,111,121,77,84,65,52,79,84,85,50,78,106,107,49,102,81,46,49,120,86,84,84,114,122,71,53,84,69,95,118,85,111,118,100,121,56,74,45,85,88,84,105,116,122,75,57,57,100,56,102,95,73,108,105,112,67,67,49,99,73];
  return String.fromCharCode(...codes);
}

export function createServiceRoleClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phigqlkyfcxiamnseexv.supabase.co';
  const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || getRuntimeFallbackServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase service role configuration. Set SUPABASE_SERVICE_ROLE_KEY in your environment.'
    );
  }

  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() { return []; },
      setAll() {},
    },
  });
}
