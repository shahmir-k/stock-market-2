// Setup screen (PRD §9.1). Initializes the simulator with $5,000 CAD.

import { SetupForm } from '@/components/setup/SetupForm';

export default function SetupPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-16">
      <div className="w-full rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
          Personal Stock Market Simulator
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Practice investing safely with virtual CAD.
        </p>

        <dl className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface-muted px-3 py-2">
            <dt className="text-xs uppercase tracking-wide text-text-muted">
              Starting cash
            </dt>
            <dd className="font-semibold text-text-primary">$5,000 CAD</dd>
          </div>
          <div className="rounded-lg border border-border bg-surface-muted px-3 py-2">
            <dt className="text-xs uppercase tracking-wide text-text-muted">
              Assets supported
            </dt>
            <dd className="font-semibold text-text-primary">Stocks &amp; ETFs</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs text-text-secondary">
          Excluded: crypto, options, margin, short selling. This simulator uses
          virtual money only and does not provide financial advice.
        </p>

        <div className="mt-6">
          <SetupForm />
        </div>
      </div>
    </main>
  );
}
