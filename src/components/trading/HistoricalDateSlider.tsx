'use client';

// Time-travel date slider used by the TradeTicket. Renders a range input
// paired with a YYYY-MM-DD date input + year tick labels + a "Today" reset
// button. PRD §3.2 + §12.1.

import { useMemo, useRef } from 'react';

import { Eyebrow } from '@/components/common/Eyebrow';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoToDays(iso: string): number {
  return Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / MS_PER_DAY);
}

function daysToIso(days: number): string {
  return new Date(days * MS_PER_DAY).toISOString().slice(0, 10);
}

function clampIso(iso: string, min: string, max: string): string {
  if (iso < min) return min;
  if (iso > max) return max;
  return iso;
}

function formatLong(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function yearTicks(
  earliest: string,
  latest: string,
): Array<{ year: number; ratio: number }> {
  const startYear = new Date(`${earliest}T00:00:00Z`).getUTCFullYear();
  const endYear = new Date(`${latest}T00:00:00Z`).getUTCFullYear();
  const span = Math.max(endYear - startYear, 1);
  const step = span > 25 ? 5 : span > 10 ? 2 : 1;
  const minDays = isoToDays(earliest);
  const maxDays = isoToDays(latest);
  const out: Array<{ year: number; ratio: number }> = [];
  let y = Math.ceil(startYear / step) * step;
  while (y <= endYear) {
    const d = isoToDays(`${y}-01-01`);
    const ratio = (d - minDays) / Math.max(maxDays - minDays, 1);
    if (ratio >= 0 && ratio <= 1) out.push({ year: y, ratio });
    y += step;
  }
  return out;
}

export type HistoricalDateSliderProps = {
  symbol: string;
  value: string;
  earliestDate: string | null;
  latestDate: string;
  minDate?: string;
  minDateReason?: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  loading?: boolean;
};

export function HistoricalDateSlider({
  symbol,
  value,
  earliestDate,
  latestDate,
  minDate,
  minDateReason,
  onChange,
  disabled,
  loading,
}: HistoricalDateSliderProps) {
  // Effective lower bound combines the asset's earliest date with an
  // optional sell-side first-purchase clamp.
  const effectiveMin =
    minDate && earliestDate
      ? minDate > earliestDate
        ? minDate
        : earliestDate
      : (minDate ?? earliestDate);

  const isLoading = loading || !effectiveMin;
  const today = todayIso();
  const isToday = value === latestDate || value === today;

  // Parent is authoritative — no local mirror needed. The controlled value
  // re-renders the input/slider on every onChange.
  const dateInputRef = useRef<HTMLInputElement>(null);

  const minDays = effectiveMin ? isoToDays(effectiveMin) : 0;
  const maxDays = isoToDays(latestDate);
  const valueDays = effectiveMin
    ? isoToDays(clampIso(value, effectiveMin, latestDate))
    : minDays;

  const ticks = useMemo(
    () => (effectiveMin ? yearTicks(effectiveMin, latestDate) : []),
    [effectiveMin, latestDate],
  );

  const commit = (next: string) => {
    if (!effectiveMin) return;
    const clamped = clampIso(next, effectiveMin, latestDate);
    onChange(clamped);
  };

  const handleRange = (raw: number) => {
    if (!effectiveMin) return;
    commit(daysToIso(raw));
  };

  const handleDate = (raw: string) => {
    if (!raw) return;
    if (!effectiveMin) return;
    commit(raw);
  };

  const handleToday = () => {
    commit(latestDate);
    dateInputRef.current?.blur();
  };

  return (
    <div
      className={`mt-6 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      aria-busy={isLoading || undefined}
    >
      <div className="flex items-baseline justify-between">
        <Eyebrow>Purchase date</Eyebrow>
        <button
          type="button"
          onClick={handleToday}
          className={`text-[10px] font-medium uppercase tracking-[0.12em] transition-colors duration-[var(--dur-fast)] ${
            isToday
              ? 'text-text-muted'
              : 'text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]'
          }`}
          disabled={isLoading}
        >
          Today
        </button>
      </div>

      {isLoading ? (
        <div className="mt-2">
          <p className="text-sm text-text-muted">Loading available range…</p>
          <div className="mt-3 h-2 w-full rounded-full bg-[var(--color-surface-muted)]" />
        </div>
      ) : (
        <>
          <input
            ref={dateInputRef}
            type="date"
            value={value}
            min={effectiveMin ?? undefined}
            max={latestDate}
            onChange={(e) => handleDate(e.target.value)}
            aria-label={`Purchase date for ${symbol}`}
            className="mt-2 bg-transparent font-display tabular text-xl text-ink outline-none transition-colors duration-[var(--dur-fast)] focus:text-[var(--color-accent)]"
          />

          <input
            type="range"
            min={minDays}
            max={maxDays}
            step={1}
            value={valueDays}
            onChange={(e) => handleRange(Number(e.target.value))}
            aria-valuemin={minDays}
            aria-valuemax={maxDays}
            aria-valuenow={valueDays}
            aria-valuetext={formatLong(value)}
            aria-label={`Time-travel slider for ${symbol}`}
            className={`mt-4 w-full appearance-none rounded-full h-1 cursor-pointer transition-opacity ${
              isToday ? 'opacity-50' : 'opacity-100'
            } [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-accent)] [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--color-accent)]`}
            style={{ background: 'var(--color-rule-strong)' }}
            onKeyDown={(e) => {
              // PageUp/Down: ±30 days; Home/End jump to bounds. Arrow keys ±1
              // are the browser default for type=range so we don't override.
              if (!effectiveMin) return;
              if (e.key === 'PageUp') {
                e.preventDefault();
                handleRange(Math.min(valueDays + 30, maxDays));
              } else if (e.key === 'PageDown') {
                e.preventDefault();
                handleRange(Math.max(valueDays - 30, minDays));
              } else if (e.key === 'Home') {
                e.preventDefault();
                handleRange(minDays);
              } else if (e.key === 'End') {
                e.preventDefault();
                handleRange(maxDays);
              }
            }}
          />

          <div className="relative mt-2 h-4 select-none text-[10px] font-medium uppercase tracking-[0.12em] text-text-muted">
            {ticks.map((t) => (
              <span
                key={t.year}
                className="absolute -translate-x-1/2"
                style={{ left: `${t.ratio * 100}%` }}
              >
                {t.year}
              </span>
            ))}
            <span className="absolute right-0">Today</span>
          </div>

          {minDateReason ? (
            <p className="mt-3 text-xs text-text-muted">{minDateReason}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
