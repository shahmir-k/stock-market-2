'use client';

import { useMemo, useState } from 'react';

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

  return (
    <>
      <div className="mt-3 flex gap-2">
        {(['BUY', 'SELL'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
              mode === m
                ? m === 'BUY'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-warning bg-warning/10 text-warning'
                : 'border-border text-text-secondary hover:bg-surface-muted'
            }`}
          >
            {m === 'BUY' ? 'Buy' : 'Sell'}
          </button>
        ))}
      </div>

      {mode === 'SELL' && holding ? (
        <p className="mt-3 text-sm text-text-secondary">
          Owned: <span className="tabular font-medium">{holding.quantity}</span>{' '}
          shares · Avg cost{' '}
          <CurrencyValue value={holding.averageCostCad} />
        </p>
      ) : null}
      {mode === 'SELL' && !holding ? (
        <p className="mt-3 text-sm text-text-secondary">
          You do not own this asset.
        </p>
      ) : null}

      <div className="mt-3">
        <label
          htmlFor="qty"
          className="block text-sm font-medium text-text-primary"
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
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
          placeholder="e.g., 1.25"
        />
      </div>

      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-text-secondary">Estimated total</dt>
          <dd className="tabular font-medium">
            {estimatedTotalCad !== null ? (
              <CurrencyValue value={estimatedTotalCad} />
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-secondary">Cash after trade</dt>
          <dd className="tabular">
            {estimatedTotalCad !== null ? (
              <CurrencyValue
                value={
                  mode === 'BUY'
                    ? cashCad - estimatedTotalCad
                    : cashCad + estimatedTotalCad
                }
              />
            ) : (
              '—'
            )}
          </dd>
        </div>
      </dl>

      {validationErr ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {validationErr}
        </p>
      ) : mode === 'SELL' && holding && qtyNum > holding.quantity ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          You cannot sell more shares than you own ({holding.quantity}).
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => {
          void onPreview();
        }}
        disabled={
          !Number.isFinite(qtyNum) ||
          qtyNum <= 0 ||
          // Pre-validate sells: must own the asset and not exceed qty.
          (mode === 'SELL' &&
            (!holding || qtyNum > holding.quantity))
        }
        className={`mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 ${
          mode === 'BUY'
            ? 'bg-accent hover:bg-accent-hover'
            : 'bg-warning hover:bg-warning/90'
        }`}
      >
        Preview {mode === 'BUY' ? 'Buy' : 'Sell'}
      </button>

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
