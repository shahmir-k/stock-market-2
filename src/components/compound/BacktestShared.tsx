'use client';

import { CurrencyValue } from '@/components/common/CurrencyValue';
import { MetricCard } from '@/components/common/MetricCard';
import type { BacktestSummary } from '@/lib/backtest';

export function BacktestSummaryCards({
  summary,
  currencyLabel,
}: {
  summary: BacktestSummary;
  currencyLabel: string;
}) {
  const gainClass = summary.gainNative >= 0 ? 'text-success' : 'text-danger';
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <MetricCard
        label="Contributed"
        value={<MoneyValue amount={summary.contributedNative} currency={currencyLabel} />}
      />
      <MetricCard
        label="Final Value"
        value={<MoneyValue amount={summary.finalValueNative} currency={currencyLabel} />}
      />
      <MetricCard
        label="Gain"
        value={
          <span className={gainClass}>
            <MoneyValue amount={summary.gainNative} currency={currencyLabel} showSign />
          </span>
        }
      />
      <MetricCard
        label="Annual Return (CAGR)"
        value={
          <span className={summary.cagrPercent >= 0 ? 'text-success' : 'text-danger'}>
            {summary.cagrPercent >= 0 ? '+' : ''}
            {summary.cagrPercent.toFixed(2)}%
          </span>
        }
      />
    </div>
  );
}

function MoneyValue({
  amount,
  currency,
  showSign,
}: {
  amount: number;
  currency: string;
  showSign?: boolean;
}) {
  // For USD or CAD the CurrencyValue component formats with the $ prefix
  // already; just append a currency label so users know which currency they
  // are looking at.
  return (
    <>
      <CurrencyValue value={amount} showSign={showSign} /> {currency}
    </>
  );
}

export function StartDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <label className="flex flex-col text-sm">
      <span className="font-medium text-text-primary">Start date</span>
      <input
        type="date"
        value={value}
        max={today}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
    </label>
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
    <label className="flex flex-col text-sm">
      <span className="font-medium text-text-primary">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder={placeholder}
        className="mt-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm uppercase focus:border-accent focus:outline-none"
      />
    </label>
  );
}

export function defaultStartDate(yearsAgo: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - yearsAgo);
  return d.toISOString().slice(0, 10);
}
