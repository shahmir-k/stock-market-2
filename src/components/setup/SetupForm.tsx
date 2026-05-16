'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useSimulatorStore } from '@/store/simulatorStore';

export function SetupForm() {
  const router = useRouter();
  const isHydrated = useSimulatorStore((s) => s.isHydrated);
  const user = useSimulatorStore((s) => s.user);
  const loadState = useSimulatorStore((s) => s.loadState);
  const initializeSimulation = useSimulatorStore(
    (s) => s.initializeSimulation,
  );

  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isHydrated) {
      void loadState();
    }
  }, [isHydrated, loadState]);

  // If a user/portfolio already exists, skip setup.
  useEffect(() => {
    if (isHydrated && user) {
      router.replace('/dashboard');
    }
  }, [isHydrated, user, router]);

  const validateName = (value: string): string | null => {
    if (value.length === 0) return null;
    if (value.length > 30) return 'Display name is too long.';
    if (!/^[\p{L}\p{N} _.-]*$/u.test(value)) {
      return 'Display name contains invalid characters.';
    }
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    const validation = validateName(trimmed);
    if (validation) {
      setError(validation);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await initializeSimulation(trimmed.length > 0 ? trimmed : undefined);
      router.push('/dashboard');
    } catch {
      setError(
        'Unable to save simulation. Your browser may be blocking localStorage.',
      );
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="display-name"
          className="block text-sm font-medium text-text-primary"
        >
          Optional display name
        </label>
        <input
          id="display-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={30}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
          placeholder="e.g., BeginnerInvestor"
        />
        {error ? (
          <p role="alert" className="mt-1 text-xs text-danger">
            {error}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {submitting ? 'Starting…' : 'Start Simulation'}
      </button>
    </form>
  );
}
