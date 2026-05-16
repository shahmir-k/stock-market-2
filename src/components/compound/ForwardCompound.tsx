'use client';

import { useMemo, useState } from 'react';

import { CompoundGrowthChart } from '@/components/charts/CompoundGrowthChart';
import { CurrencyValue } from '@/components/common/CurrencyValue';
import { LearningLink } from '@/components/common/LearningLink';
import { MetricCard } from '@/components/common/MetricCard';
import { calculateCompound } from '@/lib/compound';
import { LEARN } from '@/lib/learning';

export function ForwardCompound() {
  const [starting, setStarting] = useState(0);
  const [monthly, setMonthly] = useState(200);
  const [annual, setAnnual] = useState(7);
  const [years, setYears] = useState(40);

  const result = useMemo(
    () =>
      calculateCompound({
        startingAmount: starting,
        monthlyContribution: monthly,
        annualReturnPercent: annual,
        years,
      }),
    [starting, monthly, annual, years],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-xl border border-border bg-surface p-6 sm:grid-cols-2 lg:grid-cols-4">
        <NumField
          label="Starting Amount (CAD)"
          value={starting}
          onChange={setStarting}
        />
        <NumField
          label="Monthly Contribution (CAD)"
          value={monthly}
          onChange={setMonthly}
        />
        <NumField
          label="Annual Return (%)"
          value={annual}
          onChange={setAnnual}
          step={0.1}
        />
        <NumField label="Years Invested" value={years} onChange={setYears} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Total Contributed"
          value={<CurrencyValue value={result.totalContributedCad} />}
        />
        <MetricCard
          label="Estimated Future Value"
          value={<CurrencyValue value={result.futureValueCad} />}
        />
        <MetricCard
          label="Growth from Compounding"
          value={
            <span className="text-success">
              <CurrencyValue value={result.growthCad} showSign />
            </span>
          }
        />
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-3 text-base font-semibold">
          Contributions vs Compounded Value
        </h2>
        <CompoundGrowthChart points={result.yearlyPoints} />
      </section>

      <p className="rounded-lg border border-info/30 bg-info/5 p-3 text-sm text-text-secondary">
        This is an educational estimate. Investment returns are not guaranteed.
      </p>

      <section className="rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
        Learn:{' '}
        <LearningLink slug={LEARN.COMPOUND_GROWTH} /> ·{' '}
        <LearningLink slug={LEARN.ANNUAL_RETURN} /> ·{' '}
        <LearningLink slug={LEARN.TIME_HORIZON} /> ·{' '}
        <LearningLink slug={LEARN.CONTRIBUTION} />
      </section>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
}) {
  return (
    <label className="flex flex-col text-sm">
      <span className="font-medium text-text-primary">{label}</span>
      <input
        type="number"
        value={value}
        min={0}
        step={step}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
    </label>
  );
}
