'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StructuraLogo } from '@/components/brand/structura-logo';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const urlParam = searchParams.get('url');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const destination = urlParam ? `${redirect}?url=${encodeURIComponent(urlParam)}` : redirect;
      router.push(destination);
      router.refresh();
    } catch (err: any) {
      if (err.message?.includes('Missing Supabase') || err.message?.includes('FetchError') || err.message?.includes('Failed to fetch')) {
        setError('Supabase connection not yet configured in .env.local. You can test local demo workspace at /workspace/demo-codecompass-repo.');
      } else {
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
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
            create a new account
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
              <span className="bg-surface-secondary px-2 text-txt-muted">Demo & Quick Preview</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleDemoAccess}
            className="w-full"
          >
            Explore Interactive Demo Workspace
          </Button>
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
