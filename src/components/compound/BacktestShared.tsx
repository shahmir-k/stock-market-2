'use client';

import { CurrencyValue } from '@/components/common/CurrencyValue';
import { Kpi, KpiInline } from '@/components/common/Kpi';
import type { BacktestSummary } from '@/lib/backtest';

// Hero metric pair: giant Final Value on the left, supporting stat strip
// (Contributed · Gain · CAGR) on the right.
export function BacktestSummaryCards({
  summary,
  currencyLabel,
}: {
  summary: BacktestSummary;
  currencyLabel: string;
}) {
  const gainClass = summary.gainNative >= 0
    ? 'text-[var(--color-success)]'
    : 'text-[var(--color-danger)]';
  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-16">
      <Kpi
        label={`Final value (${currencyLabel})`}
        value={<CurrencyValue value={summary.finalValueNative} />}
        sub={
          <span className={gainClass}>
            {summary.gainNative >= 0 ? '+' : ''}
            <CurrencyValue value={summary.gainNative} />{' '}
            <span className="text-text-muted">vs your contributions</span>
          </span>
        }
      />
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 self-end border-t border-b rule py-5 sm:grid-cols-3">
        <KpiInline
          label="Contributed"
          value={<CurrencyValue value={summary.contributedNative} />}
        />
        <KpiInline
          label="Total return"
          value={
            <span
              className={
                summary.totalReturnPercent >= 0
                  ? 'text-[var(--color-success)]'
                  : 'text-[var(--color-danger)]'
              }
            >
              {summary.totalReturnPercent >= 0 ? '+' : ''}
              {summary.totalReturnPercent.toFixed(2)}%
            </span>
          }
        />
        <KpiInline
          label="CAGR"
          value={
            <span
              className={
                summary.cagrPercent >= 0
                  ? 'text-[var(--color-success)]'
                  : 'text-[var(--color-danger)]'
              }
            >
              {summary.cagrPercent >= 0 ? '+' : ''}
              {summary.cagrPercent.toFixed(2)}%
            </span>
          }
        />
      </div>
    </div>
  );
}

// Hairline-underline form field. Reused across all backtest sub-tabs.
function FieldRoot({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="eyebrow">{label}</span>
      {children}
    </label>
  );
}

const INPUT_BASE =
  'bg-transparent border-b rule pb-1 text-base tabular text-ink outline-none transition-colors duration-[var(--dur-fast)] focus:border-[var(--color-accent)]';

export function StartDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <FieldRoot label="Start date">
      <input
        type="date"
        value={value}
        max={today}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_BASE}
      />
    </FieldRoot>
  );
}

export function MoneyInput({
  label,
  value,
  onChange,
  step = 100,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
}) {
  return (
    <FieldRoot label={label}>
      <input
        type="number"
        value={value}
        min={0}
        step={step}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={INPUT_BASE}
      />
    </FieldRoot>
  );
}

export function SymbolInput({
  label = 'Symbol',
  value,
  onChange,
  placeholder = 'AAPL',
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <FieldRoot label={label}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder={placeholder}
        className={`${INPUT_BASE} uppercase tracking-wide`}
      />
    </FieldRoot>
  );
}

export function defaultStartDate(yearsAgo: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - yearsAgo);
  return d.toISOString().slice(0, 10);
}
