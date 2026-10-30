'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        router.push(redirect);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      if (err.message?.includes('Missing Supabase') || err.message?.includes('FetchError') || err.message?.includes('Failed to fetch')) {
        setError('Supabase connection is not yet configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.');
      } else {
        setError(err.message || 'Failed to create account.');
      }
    } finally {
      setLoading(false);
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
          {success ? (
            <div className="space-y-4 text-center py-4">
              <CheckCircle2 className="h-10 w-10 text-status-success mx-auto" />
              <h3 className="text-base font-semibold text-txt-primary">Check your email</h3>
              <p className="text-sm text-txt-secondary">
                We sent a confirmation link to <span className="text-txt-primary font-mono">{email}</span>. Click the link to complete sign up.
              </p>
              <Link href="/login" className="btn-secondary w-full">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-status-error/30 bg-status-error-muted/20 text-xs text-status-error">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

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
                hint="Minimum 8 characters"
              />

              <Button type="submit" variant="primary" loading={loading} className="w-full">
                Create Account
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </form>
          )}
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
