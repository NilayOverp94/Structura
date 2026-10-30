import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabaseAdmin = createServiceRoleClient();

    const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    const targetUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!targetUser.email_confirmed_at) {
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUser.id,
        { email_confirm: true }
      );

      if (confirmError) {
        return NextResponse.json({ error: confirmError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Account auto-confirmed successfully.',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Account already confirmed.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Auto-confirm failed' },
      { status: 500 }
    );
  }
}
