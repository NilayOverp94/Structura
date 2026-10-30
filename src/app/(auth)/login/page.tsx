'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StructuraLogo } from '@/components/brand/structura-logo';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const urlParam = searchParams.get('url');
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [initialEmail, email]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      const supabase = createClient();
      let { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      // If user is unconfirmed, auto-confirm them via backend and retry
      if (signInError && (signInError.message?.toLowerCase().includes('not confirmed') || signInError.message?.toLowerCase().includes('email_not_confirmed'))) {
        setStatusMessage('Auto-verifying your account...');
        try {
          const confirmRes = await fetch('/api/auth/auto-confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail }),
          });

          if (confirmRes.ok) {
            // Retry sign in
            const retry = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
            signInError = retry.error;
            data = retry.data;
          }
        } catch (e) {
          console.warn('Auto-confirm retry error:', e);
        }
      }

      if (signInError) throw signInError;

      let destination = redirect;
      if (urlParam && !destination.includes('url=')) {
        destination = `${destination}${destination.includes('?') ? '&' : '?'}url=${encodeURIComponent(urlParam)}`;
      }
      // Use window.location.href for complete cookie sync with server middleware
      window.location.href = destination;
    } catch (err: any) {
      console.error('Login error:', err);
      setStatusMessage('');
      if (err.message?.includes('Missing Supabase') || err.message?.includes('FetchError') || err.message?.includes('Failed to fetch')) {
        setError('Supabase connection is not reachable. You can test the live demo workspace.');
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. If you need a quick account, click "Sign up" or use "Demo Sign In".');
      } else {
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError('');
    setStatusMessage('');
    setDemoLoading(true);
    try {
      const res = await fetch('/api/auth/demo-login', { method: 'POST' });
      const data = await res.json();
      const { email: demoEmail, password: demoPassword } = data.credentials;

      setEmail(demoEmail);
      setPassword(demoPassword);

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (signInError) throw signInError;

      const destination = urlParam ? `${redirect}?url=${encodeURIComponent(urlParam)}` : redirect;
      window.location.href = destination;
    } catch (err: any) {
      // Fallback directly to demo workspace
      router.push('/workspace/demo-codecompass-repo');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleDemoAccess = () => {
    router.push('/workspace/demo-codecompass-repo');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-surface-primary">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block mb-4">
          <StructuraLogo size="md" showTagline={true} />
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-txt-primary mt-2">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-txt-secondary">
          Or{' '}
          <Link href={`/signup${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-accent hover:underline">
            create a new account (instant verification)
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

          <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="••••••••"
            />

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Sign In
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-secondary px-2 text-txt-muted">Demo & Instant Access</span>
            </div>
          </div>

          <div className="space-y-2">
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

            <Button
              type="button"
              variant="ghost"
              onClick={handleDemoAccess}
              className="w-full text-xs text-txt-muted hover:text-txt-primary"
            >
              Explore Public Demo Workspace Without Sign-in
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-primary" />}>
      <LoginForm />
    </Suspense>
  );
}
