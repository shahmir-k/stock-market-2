'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { Eyebrow } from '@/components/common/Eyebrow';
import { Field } from '@/components/common/Field';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type Mode = 'signin' | 'signup';

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/dashboard';

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    try {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (err) throw err;
        if (data.user && !data.session) {
          setNeedsConfirm(true);
        } else {
          router.push(redirect);
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
        router.push(redirect);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (needsConfirm) {
    return (
      <div className="space-y-3">
        <Eyebrow>Almost there</Eyebrow>
        <h2 className="font-display text-2xl text-ink">Check your email.</h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          We sent a confirmation link to{' '}
          <span className="tabular text-ink">{email}</span>. Click the link to
          finish creating your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Mode toggle — text-link style, underline-active */}
      <div className="flex items-baseline gap-6 border-b rule pb-3">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`relative -mb-px text-sm font-medium transition-colors duration-[var(--dur-fast)] ${
            mode === 'signin'
              ? 'text-ink'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Sign in
          <span
            className={`absolute -bottom-3 left-0 right-0 h-[2px] bg-[var(--color-accent)] origin-left transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] ${
              mode === 'signin' ? 'scale-x-100' : 'scale-x-0'
            }`}
          />
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`relative -mb-px text-sm font-medium transition-colors duration-[var(--dur-fast)] ${
            mode === 'signup'
              ? 'text-ink'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Create account
          <span
            className={`absolute -bottom-3 left-0 right-0 h-[2px] bg-[var(--color-accent)] origin-left transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] ${
              mode === 'signup' ? 'scale-x-100' : 'scale-x-0'
            }`}
          />
        </button>
      </div>

      <Field
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      <Field
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        helper={mode === 'signup' ? 'At least 6 characters.' : undefined}
      />

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={submitting}
        className="w-full"
      >
        {mode === 'signup' ? 'Create account' : 'Sign in'}
      </Button>
    </form>
  );
}
