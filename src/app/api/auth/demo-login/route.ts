import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DEMO_CREDENTIALS = {
  email: 'demo@structura.ai',
  password: 'Structura2024!',
  username: 'demo_developer',
};

export async function POST() {
  try {
    const supabaseAdmin = createServiceRoleClient();

    // Ensure the demo user exists and is confirmed
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existing = userList?.users?.find(
      (u) => u.email?.toLowerCase() === DEMO_CREDENTIALS.email.toLowerCase()
    );

    if (!existing) {
      await supabaseAdmin.auth.admin.createUser({
        email: DEMO_CREDENTIALS.email,
        password: DEMO_CREDENTIALS.password,
        email_confirm: true,
        user_metadata: {
          username: DEMO_CREDENTIALS.username,
        },
      });
    } else if (!existing.email_confirmed_at) {
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        email_confirm: true,
        password: DEMO_CREDENTIALS.password,
      });
    }

    return NextResponse.json({
      success: true,
      credentials: {
        email: DEMO_CREDENTIALS.email,
        password: DEMO_CREDENTIALS.password,
      },
    });
  } catch (error: any) {
    // If service role is unavailable, return hardcoded demo credentials anyway
    return NextResponse.json({
      success: true,
      credentials: {
        email: DEMO_CREDENTIALS.email,
        password: DEMO_CREDENTIALS.password,
      },
    });
  }
}
