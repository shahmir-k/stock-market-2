import Link from 'next/link';
import { Suspense } from 'react';

import { AuthForm } from '@/components/auth/AuthForm';
import { Eyebrow } from '@/components/common/Eyebrow';
import { GrainOverlay } from '@/components/common/GrainOverlay';

export default function LoginPage() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col bg-canvas text-ink">
      <GrainOverlay />

      <header className="relative z-10 mx-auto flex w-full max-w-(--container-page) items-center justify-between px-6 py-6 md:px-10">
        <Link
          href="/"
          className="font-display text-lg tracking-tight text-ink hover:text-[var(--color-accent)] transition-colors duration-[var(--dur-fast)]"
        >
          Stockletter
          <span className="text-text-muted"> · simulator</span>
        </Link>
        <Link
          href="/"
          className="text-sm text-text-secondary hover:text-ink transition-colors duration-[var(--dur-fast)]"
        >
          ← Back to overview
        </Link>
      </header>

      <div className="relative z-10 mx-auto flex flex-1 w-full max-w-md flex-col justify-center px-6 pb-24">
        <div className="fade-up">
          <Eyebrow>Account</Eyebrow>
          <h1 className="font-display mt-3 text-4xl leading-tight tracking-tight text-ink">
            Pick up where you
            <br />
            <em className="text-[var(--color-accent)]">left off.</em>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">
            Your portfolio, transaction history, and learning progress follow
            you across devices.
          </p>

          <div className="mt-10">
            <Suspense fallback={null}>
              <AuthForm />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
