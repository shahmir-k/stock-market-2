'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/common/Button';
import { CurrencyValue } from '@/components/common/CurrencyValue';
import { TradeValidationError } from '@/lib/trading/errors';
import { useSimulatorStore } from '@/store/simulatorStore';
import type { QuoteResponseData } from '@/types/market';
import type { TradePreview } from '@/types/trading';

import { TradeConfirmationModal } from './TradeConfirmationModal';

type Mode = 'BUY' | 'SELL';

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

  const qtyNum = Number(qty);
  const priceCad = useMemo(() => {
    if (quote.currency === 'CAD') return quote.priceNative;
    if (fxRate === null) return null;
    return quote.priceNative * fxRate;
  }, [quote, fxRate]);

  const estimatedTotalCad =
    priceCad !== null && Number.isFinite(qtyNum) && qtyNum > 0
      ? qtyNum * priceCad
      : null;

  const onPreview = async () => {
    setValidationErr(null);
    setExecuteErrors(undefined);
    try {
      const next =
        mode === 'BUY'
          ? await previewBuy({ symbol, quantity: qtyNum })
          : await previewSell({ symbol, quantity: qtyNum });
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
          (mode === 'SELL' && (!holding || qtyNum > holding.quantity))
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
