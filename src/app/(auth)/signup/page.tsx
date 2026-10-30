'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
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
  const [demoLoading, setDemoLoading] = useState(false);
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

  const handleDemoSignIn = async () => {
    setError('');
    setDemoLoading(true);
    try {
      const res = await fetch('/api/auth/demo-login', { method: 'POST' });
      const data = await res.json();
      const { email: demoEmail, password: demoPassword } = data.credentials;

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (signInError) throw signInError;
      window.location.href = redirect;
    } catch (err: any) {
      // Direct access fallback to demo workspace
      router.push('/workspace/demo-codecompass-repo');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-surface-primary">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block mb-4">
          <StructuraLogo size="md" showTagline={true} />
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-txt-primary mt-2">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-txt-secondary">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline">
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
            <div className="flex items-center gap-2 p-3 rounded-lg border border-accent/30 bg-accent/10 text-xs text-accent">
              <Sparkles className="h-4 w-4 flex-shrink-0 animate-spin" />
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
              placeholder="you@domain.com"
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              hint="Minimum 8 characters — instant verification (no email wait)"
            />

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Create Instant Account
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-secondary px-2 text-txt-muted">Or Instant Access</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            loading={demoLoading}
            onClick={handleDemoSignIn}
            className="w-full text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-accent" />
            Sign in as Demo User (1-Click)
          </Button>
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
