'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/common/Button';
import { CurrencyValue } from '@/components/common/CurrencyValue';
import { TradeValidationError } from '@/lib/trading/errors';
import { useSimulatorStore } from '@/store/simulatorStore';
import type {
  FxResponseData,
  HistoricalQuoteResponseData,
  HistoryRangeResponseData,
  QuoteResponseData,
} from '@/types/market';
import type { TradePreview } from '@/types/trading';

import { HistoricalDateSlider } from './HistoricalDateSlider';
import { TradeConfirmationModal } from './TradeConfirmationModal';

type Mode = 'BUY' | 'SELL';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TradeTicket({
  symbol,
  quote,
  fxRate,
}: {
  symbol: string;
  quote: QuoteResponseData;
  fxRate: number | null;
}) {
  const previewBuy = useSimulatorStore((s) => s.previewBuy);
  const previewSell = useSimulatorStore((s) => s.previewSell);
  const executeBuy = useSimulatorStore((s) => s.executeBuy);
  const executeSell = useSimulatorStore((s) => s.executeSell);
  const getHistoricalQuoteAt = useSimulatorStore((s) => s.getHistoricalQuoteAt);
  const getHistoricalFxAt = useSimulatorStore((s) => s.getHistoricalFxAt);
  const getHistoryRange = useSimulatorStore((s) => s.getHistoryRange);
  const cashCad = useSimulatorStore((s) => s.portfolio.cashCad);
  const holding = useSimulatorStore((s) =>
    s.portfolio.holdings.find((h) => h.symbol === symbol),
  );

  const [mode, setMode] = useState<Mode>('BUY');
  const [qty, setQty] = useState('');
  const [validationErr, setValidationErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<TradePreview | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executeErrors, setExecuteErrors] = useState<string[] | undefined>();

  // Time-travel state.
  const [purchaseDate, setPurchaseDate] = useState<string>(todayIso);
  const [range, setRange] = useState<HistoryRangeResponseData | null>(null);
  const [rangeLoading, setRangeLoading] = useState(true);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [historicalQuote, setHistoricalQuote] =
    useState<HistoricalQuoteResponseData | null>(null);
  const [historicalFx, setHistoricalFx] = useState<FxResponseData | null>(null);
  const [chipsLoading, setChipsLoading] = useState(false);

  // Load asset's slider bounds once per symbol.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      setRangeLoading(true);
      setRangeError(null);
      try {
        const r = await getHistoryRange(symbol);
        if (!cancelled) {
          setRange(r);
          setRangeLoading(false);
        }
      } catch {
        if (!cancelled) {
          setRangeError(
            "Couldn't load this asset's price history. Try again.",
          );
          setRangeLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol, getHistoryRange]);

  // Debounced (200ms) preview-chip fetch when purchaseDate ≠ today.
  useEffect(() => {
    let cancelled = false;
    const today = todayIso();
    const handle = setTimeout(async () => {
      if (cancelled) return;
      if (purchaseDate === today) {
        setHistoricalQuote(null);
        setHistoricalFx(null);
        setChipsLoading(false);
        return;
      }
      setChipsLoading(true);
      try {
        const hq = await getHistoricalQuoteAt(symbol, purchaseDate);
        if (cancelled) return;
        setHistoricalQuote(hq);
        if (quote.currency === 'USD') {
          const fx = await getHistoricalFxAt('USD', 'CAD', purchaseDate);
          if (!cancelled) setHistoricalFx(fx);
        } else {
          setHistoricalFx(null);
        }
      } catch {
        if (!cancelled) {
          setHistoricalQuote(null);
          setHistoricalFx(null);
        }
      } finally {
        if (!cancelled) setChipsLoading(false);
      }
    }, purchaseDate === today ? 0 : 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [
    purchaseDate,
    symbol,
    quote.currency,
    getHistoricalQuoteAt,
    getHistoricalFxAt,
  ]);

  const qtyNum = Number(qty);
  const isTimeTraveled = purchaseDate !== todayIso();

  const priceCad = useMemo(() => {
    // Use the historical close + historical FX when the slider is back-dated.
    if (isTimeTraveled && historicalQuote) {
      const histFxRate =
        quote.currency === 'CAD' ? 1 : historicalFx?.rate ?? null;
      if (quote.currency !== 'CAD' && histFxRate === null) return null;
      return historicalQuote.closeNative * (histFxRate ?? 1);
    }
    if (quote.currency === 'CAD') return quote.priceNative;
    if (fxRate === null) return null;
    return quote.priceNative * fxRate;
  }, [isTimeTraveled, historicalQuote, historicalFx, quote, fxRate]);

  const estimatedTotalCad =
    priceCad !== null && Number.isFinite(qtyNum) && qtyNum > 0
      ? qtyNum * priceCad
      : null;

  // Visible reason copy when SELL slider is clamped by firstPurchaseDate.
  const sellMinDateReason =
    mode === 'SELL' && holding?.firstPurchaseDate
      ? `You didn't own ${symbol} before ${holding.firstPurchaseDate}.`
      : undefined;

  // Disable Preview when historical fetch failed mid-flight.
  const historicalUnavailable =
    isTimeTraveled && !chipsLoading && historicalQuote === null;

  const onPreview = async () => {
    setValidationErr(null);
    setExecuteErrors(undefined);
    try {
      const orderBase = { symbol, quantity: qtyNum };
      const orderWithDate = isTimeTraveled
        ? { ...orderBase, purchaseDate }
        : orderBase;
      const next =
        mode === 'BUY'
          ? await previewBuy(orderWithDate)
          : await previewSell(orderWithDate);
      setPreview(next);
      setConfirmOpen(true);
    } catch (err) {
      if (err instanceof TradeValidationError) {
        setValidationErr(err.message);
      } else {
        setValidationErr(
          err instanceof Error ? err.message : 'Unable to preview trade.',
        );
      }
    }
  };

  const onConfirm = async () => {
    if (!preview) return;
    setExecuting(true);
    setExecuteErrors(undefined);
    const result =
      preview.type === 'BUY'
        ? await executeBuy(preview)
        : await executeSell(preview);
    setExecuting(false);
    if (result.success) {
      setConfirmOpen(false);
      setPreview(null);
      setQty('');
    } else {
      setExecuteErrors(result.errors);
    }
  };

  const sellOverOwned =
    mode === 'SELL' && holding && qtyNum > holding.quantity;

  return (
    <>
      {/* Mode toggle — underline-active text buttons */}
      <div className="flex items-baseline gap-5 border-b rule pb-2">
        {(['BUY', 'SELL'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`relative -mb-px py-1 text-sm font-medium transition-colors duration-[var(--dur-fast)] ${
              mode === m
                ? 'text-ink'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {m === 'BUY' ? 'Buy' : 'Sell'}
            <span
              className={`absolute -bottom-[9px] left-0 right-0 h-[2px] origin-left bg-[var(--color-accent)] transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] ${
                mode === m ? 'scale-x-100' : 'scale-x-0'
              }`}
            />
          </button>
        ))}
      </div>

      {mode === 'SELL' && holding ? (
        <p className="mt-4 text-xs text-text-muted">
          Owned <span className="tabular text-ink">{holding.quantity}</span>{' '}
          shares · Average cost{' '}
          <span className="tabular text-ink">
            <CurrencyValue value={holding.averageCostCad} />
          </span>
        </p>
      ) : null}
      {mode === 'SELL' && !holding ? (
        <p className="mt-4 text-xs text-text-muted">
          You don&apos;t own this asset yet.
        </p>
      ) : null}

      {/* Purchase-date slider — time-travel feature. */}
      {rangeError ? (
        <div className="mt-6">
          <p role="alert" className="text-sm text-[var(--color-danger)]">
            {rangeError}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => {
              setRangeError(null);
              setRangeLoading(true);
              void (async () => {
                try {
                  const r = await getHistoryRange(symbol);
                  setRange(r);
                  setRangeLoading(false);
                } catch {
                  setRangeError(
                    "Couldn't load this asset's price history. Try again.",
                  );
                  setRangeLoading(false);
                }
              })();
            }}
          >
            Retry
          </Button>
        </div>
      ) : (
        <HistoricalDateSlider
          symbol={symbol}
          value={purchaseDate}
          earliestDate={range?.earliestDate ?? null}
          latestDate={range?.latestDate ?? todayIso()}
          minDate={mode === 'SELL' ? holding?.firstPurchaseDate : undefined}
          minDateReason={sellMinDateReason}
          onChange={setPurchaseDate}
          loading={rangeLoading}
        />
      )}

      {/* Historical preview chips — only when time-traveled. */}
      {isTimeTraveled ? (
        <dl className="mt-4 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <dt className="text-text-muted">Price on {purchaseDate}</dt>
            <dd className="tabular text-ink">
              {chipsLoading ? (
                <span className="text-text-muted">…</span>
              ) : historicalQuote ? (
                `${historicalQuote.closeNative.toFixed(2)} ${quote.currency}`
              ) : (
                <span className="text-text-muted">—</span>
              )}
            </dd>
          </div>
          {historicalQuote && historicalQuote.actualDate !== purchaseDate ? (
            <div className="text-text-muted">
              Used close of {historicalQuote.actualDate} (markets closed)
            </div>
          ) : null}
          {quote.currency === 'USD' ? (
            <div className="flex justify-between">
              <dt className="text-text-muted">FX on that date</dt>
              <dd className="tabular text-ink">
                {chipsLoading ? (
                  <span className="text-text-muted">…</span>
                ) : historicalFx ? (
                  historicalFx.rate.toFixed(4)
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </dd>
            </div>
          ) : null}
          {historicalUnavailable ? (
            <p role="alert" className="text-[var(--color-danger)]">
              No price data on that date.
            </p>
          ) : null}
        </dl>
      ) : null}

      {/* Quantity input — hairline underline, no boxed border */}
      <div className="mt-6">
        <label
          htmlFor="qty"
          className="eyebrow"
        >
          Quantity
        </label>
        <input
          id="qty"
          type="number"
          step="0.000001"
          min="0"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="0"
          className="mt-2 w-full bg-transparent border-b rule pb-1 font-display tabular text-3xl text-ink outline-none transition-colors duration-[var(--dur-fast)] focus:border-[var(--color-accent)]"
        />
      </div>

      <dl className="mt-6 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-text-secondary">Estimated total</dt>
          <dd className="tabular text-ink">
            {estimatedTotalCad !== null ? (
              <CurrencyValue value={estimatedTotalCad} />
            ) : (
              <span className="text-text-muted">—</span>
            )}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-secondary">Cash after</dt>
          <dd className="tabular text-text-secondary">
            {estimatedTotalCad !== null ? (
              <CurrencyValue
                value={
                  mode === 'BUY'
                    ? cashCad - estimatedTotalCad
                    : cashCad + estimatedTotalCad
                }
              />
            ) : (
              <span className="text-text-muted">—</span>
            )}
          </dd>
        </div>
      </dl>

      {validationErr ? (
        <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">
          {validationErr}
        </p>
      ) : sellOverOwned ? (
        <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">
          You can&apos;t sell more shares than you own ({holding!.quantity}).
        </p>
      ) : null}

      <Button
        type="button"
        variant="primary"
        size="lg"
        className="mt-6 w-full"
        onClick={() => {
          void onPreview();
        }}
        disabled={
          !Number.isFinite(qtyNum) ||
          qtyNum <= 0 ||
          (mode === 'SELL' && (!holding || qtyNum > holding.quantity)) ||
          historicalUnavailable ||
          chipsLoading ||
          rangeLoading
        }
      >
        Preview {mode === 'BUY' ? 'Buy' : 'Sell'} →
      </Button>

      <TradeConfirmationModal
        open={confirmOpen}
        preview={preview}
        submitting={executing}
        errors={executeErrors}
        onConfirm={() => {
          void onConfirm();
        }}
        onCancel={() => {
          setConfirmOpen(false);
          setPreview(null);
        }}
      />
    </>
  );
}
