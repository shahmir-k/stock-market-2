'use client';

import { CurrencyValue } from '@/components/common/CurrencyValue';
import { EmptyState } from '@/components/common/EmptyState';
import {
  selectRecentTransactions,
  useSimulatorStore,
} from '@/store/simulatorStore';

export function TransactionHistoryTable() {
  const txs = useSimulatorStore(selectRecentTransactions);

  if (txs.length === 0) {
    return <EmptyState message="No trades yet." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-muted text-xs uppercase tracking-wide text-text-secondary">
          <tr>
            <th className="px-4 py-3">Date / Time</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Symbol</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3 text-right">Price (Native)</th>
            <th className="px-4 py-3 text-right">FX</th>
            <th className="px-4 py-3 text-right">Total CAD</th>
            <th className="px-4 py-3 text-right">Realized G/L</th>
            <th className="px-4 py-3">Quote ts</th>
          </tr>
        </thead>
        <tbody>
          {txs.map((t) => (
            <tr key={t.id} className="border-t border-border">
              <td className="px-4 py-3 text-text-secondary">
                {new Date(t.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                    t.type === 'BUY'
                      ? 'bg-accent/10 text-accent'
                      : 'bg-warning/15 text-warning'
                  }`}
                >
                  {t.type}
                </span>
              </td>
              <td className="px-4 py-3 font-semibold">{t.symbol}</td>
              <td className="px-4 py-3 text-right tabular">{t.quantity}</td>
              <td className="px-4 py-3 text-right tabular">
                {t.priceNative.toFixed(2)} {t.nativeCurrency}
              </td>
              <td className="px-4 py-3 text-right tabular">
                {t.fxRateToCad.toFixed(4)}
              </td>
              <td className="px-4 py-3 text-right tabular font-medium">
                <CurrencyValue value={t.totalCad} />
              </td>
              <td className="px-4 py-3 text-right tabular">
                {t.type === 'SELL' && t.realizedGainLossCad !== undefined ? (
                  <span
                    className={
                      t.realizedGainLossCad >= 0
                        ? 'text-success'
                        : 'text-danger'
                    }
                  >
                    <CurrencyValue value={t.realizedGainLossCad} showSign />
                  </span>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-text-secondary">
                {new Date(t.quoteTimestamp).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
