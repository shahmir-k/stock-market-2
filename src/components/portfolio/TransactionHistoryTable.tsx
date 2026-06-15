'use client';

import { Badge } from '@/components/common/Badge';
import { CurrencyValue } from '@/components/common/CurrencyValue';
import { Eyebrow } from '@/components/common/Eyebrow';
import {
  selectRecentTransactions,
  useSimulatorStore,
} from '@/store/simulatorStore';
import type { Transaction } from '@/types/portfolio';

// Timeline-style transaction history grouped by **purchase date** (the
// settlement day chosen by the user), not the wall-clock created-at. This
// is what the time-travel feature surfaces — a 2010 buy logged today
// belongs in the 2010 column visually.
function groupByDay(txs: Transaction[]): Array<{ day: string; items: Transaction[] }> {
  const groups = new Map<string, Transaction[]>();
  for (const t of txs) {
    const day = t.purchaseDate;
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(t);
  }
  return Array.from(groups.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, items]) => ({ day, items }));
}

function formatDay(iso: string): string {
  // `iso` is YYYY-MM-DD (from purchaseDate); construct as UTC so the local
  // tz can't shift the date back by a day.
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return `${diffMo}mo ago`;
  return `${Math.floor(diffMo / 12)}y ago`;
}

export function TransactionHistoryTable() {
  const txs = useSimulatorStore(selectRecentTransactions);

  if (txs.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        No trades recorded yet.
      </p>
    );
  }

  const grouped = groupByDay(txs);

  return (
    <div className="space-y-10">
      {grouped.map(({ day, items }) => (
        <section key={day}>
          <header className="border-b rule pb-3">
            <Eyebrow>{formatDay(day)}</Eyebrow>
            <p className="mt-1 text-xs text-text-muted">
              {items.length} {items.length === 1 ? 'trade' : 'trades'}
            </p>
          </header>
          <ul className="divide-y rule">
            {items.map((t) => (
              <li
                key={t.id}
                className="grid grid-cols-[60px_1fr_auto_auto] items-baseline gap-x-6 py-3 text-sm"
              >
                <span
                  className={`text-[10px] font-medium uppercase tracking-[0.12em] ${
                    t.type === 'BUY'
                      ? 'text-[var(--color-success)]'
                      : 'text-[var(--color-danger)]'
                  }`}
                >
                  {t.type}
                </span>
                <span className="text-ink">
                  <span className="font-medium">{t.symbol}</span>
                  {t.isTimeTraveled ? (
                    <Badge tone="accent" variant="text" className="ml-2">
                      Time-traveled
                    </Badge>
                  ) : null}
                  <span className="text-text-muted">
                    {' · '}
                    <span className="tabular">
                      {t.quantity} {t.quantity === 1 ? 'share' : 'shares'}
                    </span>{' '}
                    at <span className="tabular">{t.priceNative.toFixed(2)}</span>{' '}
                    {t.nativeCurrency}{' '}
                    {t.nativeCurrency !== 'CAD' ? (
                      <span className="text-xs">(fx {t.fxRateToCad.toFixed(4)})</span>
                    ) : null}
                  </span>
                  <span className="block text-[11px] text-text-muted">
                    logged {timeAgo(t.timestamp)}
                  </span>
                </span>
                <span className="tabular text-right text-ink">
                  <CurrencyValue value={t.totalCad} />
                </span>
                <span className="tabular text-right text-xs">
                  {t.type === 'SELL' && t.realizedGainLossCad !== undefined ? (
                    <span
                      className={
                        t.realizedGainLossCad >= 0
                          ? 'text-[var(--color-success)]'
                          : 'text-[var(--color-danger)]'
                      }
                    >
                      <CurrencyValue value={t.realizedGainLossCad} showSign />
                    </span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
