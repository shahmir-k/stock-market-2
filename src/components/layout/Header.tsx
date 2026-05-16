'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { CurrencyValue } from '@/components/common/CurrencyValue';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  selectPortfolioValueCad,
  useSimulatorStore,
} from '@/store/simulatorStore';

import { SyncStatus } from './SyncStatus';

export function Header() {
  const router = useRouter();
  const portfolioValue = useSimulatorStore(selectPortfolioValueCad);
  const isHydrated = useSimulatorStore((s) => s.isHydrated);

  const onLogout = async () => {
    try {
      await getSupabaseBrowserClient().auth.signOut();
    } catch {
      /* ignore — even if Supabase isn't configured, navigate to / */
    }
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 border-b rule bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-(--container-page) items-center justify-between px-6 md:px-10">
        {/* Wordmark — display serif gives the app an "editorial publication" tone */}
        <Link
          href="/dashboard"
          className="font-display text-lg tracking-tight text-ink hover:text-[var(--color-accent)] transition-colors duration-[var(--dur-fast)]"
        >
          Stockletter
          <span className="text-text-muted"> · simulator</span>
        </Link>

        <div className="flex items-center gap-5">
          {isHydrated ? (
            <>
              <SyncStatus />
              <span className="hidden sm:inline-flex items-baseline gap-1.5 text-xs text-text-muted">
                <span className="tracking-wide uppercase">Portfolio</span>
                <span className="tabular text-sm text-ink">
                  <CurrencyValue value={portfolioValue} />
                </span>
              </span>
            </>
          ) : null}
          <Link
            href="/settings"
            className="text-sm text-text-secondary hover:text-ink transition-colors duration-[var(--dur-fast)]"
            aria-label="Settings"
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={() => {
              void onLogout();
            }}
            className="text-sm text-text-secondary hover:text-ink transition-colors duration-[var(--dur-fast)]"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
