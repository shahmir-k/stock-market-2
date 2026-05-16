'use client';

import { useMemo, useState } from 'react';

import { CompoundGrowthChart } from '@/components/charts/CompoundGrowthChart';
import { CurrencyValue } from '@/components/common/CurrencyValue';
import { Eyebrow } from '@/components/common/Eyebrow';
import { Kpi, KpiInline } from '@/components/common/Kpi';
import { LearningLink } from '@/components/common/LearningLink';
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
    <div className="space-y-12">
      {/* Inputs — hairline underline pattern, no boxed card */}
      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        <NumField label="Starting amount" prefix="$" value={starting} onChange={setStarting} />
        <NumField label="Monthly contribution" prefix="$" value={monthly} onChange={setMonthly} />
        <NumField label="Annual return" suffix="%" value={annual} onChange={setAnnual} step={0.1} />
        <NumField label="Years invested" value={years} onChange={setYears} />
      </section>

      {/* Hero result: giant serif future value + supporting stats */}
      <section className="grid gap-10 md:grid-cols-2 md:gap-16">
        <Kpi
          label="Estimated future value"
          value={<CurrencyValue value={result.futureValueCad} />}
          sub={
            <span className="text-[var(--color-success)]">
              +<CurrencyValue value={result.growthCad} />{' '}
              <span className="text-text-muted">from compounding</span>
            </span>
          }
        />
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 self-end border-t border-b rule py-5">
          <KpiInline
            label="Total contributed"
            value={<CurrencyValue value={result.totalContributedCad} />}
          />
          <KpiInline
            label="Time horizon"
            value={
              <span>
                {years} <span className="text-text-muted">years</span>
              </span>
            }
          />
        </div>
      </section>

      {/* Chart — full width, no boxed card */}
      <section>
        <header className="mb-4 border-b rule pb-3">
          <Eyebrow>Growth over time</Eyebrow>
          <h2 className="font-display mt-2 text-2xl text-ink">
            Contributions vs compounded value
          </h2>
        </header>
        <CompoundGrowthChart points={result.yearlyPoints} />
      </section>

      <p className="max-w-prose text-sm text-text-secondary">
        These figures are an educational estimate. Investment returns vary year
        to year and are not guaranteed.
      </p>

      <section className="border-t rule pt-6 text-sm text-text-muted">
        Read:{' '}
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
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="eyebrow">{label}</span>
      <span className="flex items-baseline gap-1 border-b rule pb-1">
        {prefix ? <span className="text-text-muted">{prefix}</span> : null}
        <input
          type="number"
          value={value}
          min={0}
          step={step}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="flex-1 bg-transparent font-display tabular text-2xl text-ink outline-none"
        />
        {suffix ? <span className="text-text-muted">{suffix}</span> : null}
      </span>
    </label>
  );
}
