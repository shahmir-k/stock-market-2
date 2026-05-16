'use client';

import { CurrencyValue } from '@/components/common/CurrencyValue';
import { KpiInline } from '@/components/common/Kpi';
import {
  selectCashCad,
  selectInvestedValueCad,
  selectRealizedGainLossCad,
  selectUnrealizedGainLossCad,
  useSimulatorStore,
} from '@/store/simulatorStore';

// Inline stat strip: Cash · Invested · Realized · Unrealized.
// Lives directly under the hero KPI; hairline rules separate cells; no
// surrounding card.
export function StatStrip() {
  const cash = useSimulatorStore(selectCashCad);
  const invested = useSimulatorStore(selectInvestedValueCad);
  const realized = useSimulatorStore(selectRealizedGainLossCad);
  const unrealized = useSimulatorStore(selectUnrealizedGainLossCad);

  const items = [
    { label: 'Cash', value: <CurrencyValue value={cash} /> },
    { label: 'Invested', value: <CurrencyValue value={invested} /> },
    {
      label: 'Realized',
      value: (
        <span className={realized >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
          <CurrencyValue value={realized} showSign />
        </span>
      ),
    },
    {
      label: 'Unrealized',
      value: (
        <span className={unrealized >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
          <CurrencyValue value={unrealized} showSign />
        </span>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-b rule py-5 sm:grid-cols-4">
      {items.map((item) => (
        <KpiInline key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  );
}
