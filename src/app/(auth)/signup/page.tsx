'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StructuraLogo } from '@/components/brand/structura-logo';
import { createClient } from '@/lib/supabase/client';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      const supabase = createClient();

      setStatusMessage('Creating developer account...');

      // First attempt: direct Supabase sign up (email verification is disabled)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: username.trim() || cleanEmail.split('@')[0],
          },
        },
      });

      const uName = username.trim() || cleanEmail.split('@')[0];
      try {
        localStorage.setItem('structura_username', uName);
        localStorage.setItem('structura_user_email', cleanEmail);
      } catch {}

      if (!signUpError && (signUpData?.session || signUpData?.user)) {
        if (signUpData.session) {
          window.location.href = redirect;
          return;
        }

        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!signInErr) {
          window.location.href = redirect;
          return;
        }
      }

      // If user already registered, automatically sign them in
      if (signUpError?.message?.toLowerCase().includes('already registered')) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!signInErr) {
          window.location.href = redirect;
          return;
        }
      }

      // Fallback: Server-side account creation with automatic instant confirmation
      setStatusMessage('Setting up developer workspace...');
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          username: username.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok && signUpError) {
        throw new Error(signUpError.message || data.error || 'Failed to create account.');
      }

      const { error: finalSignInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (finalSignInError) {
        router.push(`/login?email=${encodeURIComponent(cleanEmail)}&redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      window.location.href = redirect;
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to complete registration.');
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-surface-primary">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block mb-4">
          <StructuraLogo size="md" showTagline={false} />
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-txt-primary mt-2">
          Create your developer account
        </h2>
        <p className="mt-2 text-xs text-txt-secondary">
          Already have an account?{' '}
          <Link href="/login" className="text-txt-primary underline hover:text-white font-medium">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="card space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-status-error/30 bg-status-error-muted/20 text-xs text-status-error">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-zinc-700 bg-zinc-800/30 text-xs text-txt-primary">
              <span>{statusMessage}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              label="Username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="developer42"
            />

            <Input
              label="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@example.com"
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <p className="text-[11px] text-txt-muted leading-relaxed">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Create Account
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-primary" />}>
      <SignupForm />
    </Suspense>
  );
}
