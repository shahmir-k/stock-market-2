'use client';

import { CurrencyValue } from '@/components/common/CurrencyValue';
import {
  selectRecentTransactions,
  useSimulatorStore,
} from '@/store/simulatorStore';

// Editorial timeline of recent trades. Hairline-separated rows, no boxed
// card. Type column is text only (tone-coloured), not a chunky chip.
export function RecentTradesList({ limit = 5 }: { limit?: number }) {
  const all = useSimulatorStore(selectRecentTransactions);
  const recent = all.slice(0, limit);

  if (recent.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        No trades yet. Place your first buy from{' '}
        <a href="/browse" className="text-[var(--color-accent)] underline-offset-2 hover:underline">
          Browse
        </a>
        .
      </p>
    );
  }

  return (
    <ul className="divide-y rule">
      {recent.map((t) => (
        <li
          key={t.id}
          className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-4 py-3 text-sm"
        >
          <span
            className={`text-xs font-medium uppercase tracking-[0.08em] ${
              t.type === 'BUY' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
            }`}
          >
            {t.type}
          </span>
          <span className="text-ink">
            <span className="tabular">{t.symbol}</span>
            <span className="text-text-muted"> · </span>
            <span className="tabular text-text-secondary">
              {t.quantity} {t.quantity === 1 ? 'share' : 'shares'}
            </span>
          </span>
          <span className="tabular text-text-secondary">
            <CurrencyValue value={t.totalCad} />
          </span>
        </li>
      ))}
    </ul>
  );
}
