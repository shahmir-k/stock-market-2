import { Suspense } from 'react';

import { AuthForm } from '@/components/auth/AuthForm';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-16">
      <div className="w-full rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Sign in or create an account to save your simulator portfolio.
        </p>
        <div className="mt-6">
          <Suspense fallback={null}>
            <AuthForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
