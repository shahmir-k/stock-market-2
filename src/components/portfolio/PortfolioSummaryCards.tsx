'use client';

import { CurrencyValue } from '@/components/common/CurrencyValue';
import { MetricCard } from '@/components/common/MetricCard';
import { ReturnValue } from '@/components/common/ReturnValue';
import {
  selectCashCad,
  selectInvestedValueCad,
  selectPortfolioValueCad,
  selectTotalReturnCad,
  selectTotalReturnPercent,
  useSimulatorStore,
} from '@/store/simulatorStore';

export function PortfolioSummaryCards() {
  const total = useSimulatorStore(selectPortfolioValueCad);
  const cash = useSimulatorStore(selectCashCad);
  const invested = useSimulatorStore(selectInvestedValueCad);
  const returnCad = useSimulatorStore(selectTotalReturnCad);
  const returnPct = useSimulatorStore(selectTotalReturnPercent);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard label="Total" value={<CurrencyValue value={total} />} />
      <MetricCard label="Cash" value={<CurrencyValue value={cash} />} />
      <MetricCard label="Invested" value={<CurrencyValue value={invested} />} />
      <MetricCard
        label="Return"
        value={<ReturnValue cad={returnCad} percent={returnPct} layout="stacked" />}
      />
    </div>
  );
}
