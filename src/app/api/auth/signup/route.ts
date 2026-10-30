import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  username: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues?.[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    const { email, password, username } = result.data;
    const cleanEmail = email.trim().toLowerCase();

    let supabaseAdmin;
    try {
      supabaseAdmin = createServiceRoleClient();
    } catch (e: any) {
      return NextResponse.json(
        { error: 'Server authentication configuration missing: ' + e.message },
        { status: 500 }
      );
    }

    // Check if user already exists
    const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.warn('Error listing users during signup check:', listError.message);
    }

    const existingUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (existingUser) {
      // If user was created earlier with unconfirmed email, automatically confirm them now!
      if (!existingUser.email_confirmed_at) {
        const { data: updated, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          {
            email_confirm: true,
            password: password,
            user_metadata: {
              username: username || existingUser.user_metadata?.username || cleanEmail.split('@')[0],
            },
          }
        );

        if (updateErr) {
          return NextResponse.json({ error: updateErr.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          autoConfirmed: true,
          user: updated.user,
          message: 'Account confirmed and password updated. Signing you in...',
        });
      }

      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Create user with instant email confirmation (no SMTP email required)
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        username: username || cleanEmail.split('@')[0],
      },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // If profile table exists, ensure profile entry
    try {
      await supabaseAdmin.from('profiles').upsert({
        id: created.user.id,
        username: username || cleanEmail.split('@')[0],
        avatar_url: null,
      });
    } catch {
      // Profile table optional
    }

    return NextResponse.json({
      success: true,
      user: created.user,
      message: 'Account created and verified successfully.',
    });
  } catch (error: any) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during account creation.' },
      { status: 500 }
    );
  }
}
