'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { CurrencyValue } from '@/components/common/CurrencyValue';
import { SyncStatusBadge } from '@/components/common/SyncStatusBadge';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  selectPortfolioValueCad,
  useSimulatorStore,
} from '@/store/simulatorStore';

export function Header() {
  const router = useRouter();
  const portfolioValue = useSimulatorStore(selectPortfolioValueCad);
  const isHydrated = useSimulatorStore((s) => s.isHydrated);

  const onLogout = async () => {
    try {
      await getSupabaseBrowserClient().auth.signOut();
    } catch {
      // ignore — even if Supabase isn't configured, navigate to /
    }
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
      <Link href="/dashboard" className="font-semibold text-text-primary">
        Personal Stock Simulator
      </Link>
      <div className="flex items-center gap-4">
        {isHydrated ? (
          <>
            <SyncStatusBadge />
            <span className="text-sm text-text-secondary">
              Portfolio:{' '}
              <span className="font-semibold text-text-primary">
                <CurrencyValue value={portfolioValue} />
              </span>
            </span>
          </>
        ) : null}
        <Link
          href="/settings"
          className="text-sm text-text-secondary hover:text-text-primary"
          aria-label="Settings"
        >
          Settings
        </Link>
        <button
          type="button"
          onClick={() => {
            void onLogout();
          }}
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
