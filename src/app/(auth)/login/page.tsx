'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StructuraLogo } from '@/components/brand/structura-logo';
import { createClient } from '@/lib/supabase/client';
import { notionEase } from '@/lib/animations/motion';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const urlParam = searchParams.get('url');
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
        setStatusMessage('Verifying developer account...');
        try {
          const confirmRes = await fetch('/api/auth/auto-confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail }),
          });

          if (confirmRes.ok) {
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

      try {
        const u = cleanEmail.split('@')[0];
        localStorage.setItem('structura_username', u);
        localStorage.setItem('structura_user_email', cleanEmail);
      } catch {}

      let destination = redirect;
      if (urlParam && !destination.includes('url=')) {
        destination = `${destination}${destination.includes('?') ? '&' : '?'}url=${encodeURIComponent(urlParam)}`;
      }
      window.location.href = destination;
    } catch (err: any) {
      console.error('Login error:', err);
      setStatusMessage('');
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please verify your credentials or create a new account.');
      } else {
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-surface-primary">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block">
          <StructuraLogo size="md" showTagline={false} />
        </Link>
        <h2 className="mt-6 text-2xl font-bold text-txt-primary tracking-tight">
          Sign in to your account
        </h2>
        <p className="mt-2 text-xs text-txt-secondary">
          Don&apos;t have an account?{' '}
          <Link
            href={`/signup?redirect=${encodeURIComponent(redirect)}${urlParam ? `&url=${encodeURIComponent(urlParam)}` : ''}`}
            className="text-txt-primary underline hover:text-white font-medium"
          >
            Create one now
          </Link>
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: notionEase }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0"
      >
        <div className="card space-y-5">
          {error && (
            <div className="p-3 rounded-lg border border-status-error/30 bg-status-error-muted/20 text-xs text-status-error flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && (
            <div className="p-3 rounded-lg border border-zinc-700 bg-zinc-800/30 text-xs text-txt-primary flex items-center gap-2">
              <span>{statusMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="developer@example.com"
            />

            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Sign In
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>
        </div>
      </motion.div>
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
