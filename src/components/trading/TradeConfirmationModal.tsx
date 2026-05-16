'use client';

import { useEffect, useRef } from 'react';

import { CurrencyValue } from '@/components/common/CurrencyValue';
import { LearningLink } from '@/components/common/LearningLink';
import { LearningDrawerProvider } from '@/components/learn/LearningDrawer';
import { LEARN } from '@/lib/learning';
import type { TradePreview } from '@/types/trading';

import { RiskWarningInline } from './RiskWarningInline';

export function TradeConfirmationModal({
  open,
  preview,
  submitting,
  errors,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  preview: TradePreview | null;
  submitting?: boolean;
  errors?: string[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!preview) return null;

  const isBuy = preview.type === 'BUY';

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      className="rounded-2xl border border-border bg-surface p-0 shadow-xl backdrop:bg-slate-900/40"
    >
      <LearningDrawerProvider>
      <div className="w-[28rem] max-w-[calc(100vw-2rem)] p-6">
        <h2 className="text-lg font-semibold">
          {isBuy ? 'Buy' : 'Sell'} {preview.symbol} — {preview.assetName}
        </h2>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-secondary">Price</dt>
            <dd className="tabular">
              {preview.priceNative.toFixed(2)} {preview.nativeCurrency}
            </dd>
          </div>
          {preview.nativeCurrency !== 'CAD' ? (
            <div className="flex justify-between">
              <dt className="text-text-secondary">FX rate</dt>
              <dd className="tabular">{preview.fxRateToCad.toFixed(4)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-text-secondary">Quantity</dt>
            <dd className="tabular">{preview.quantity}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-secondary">
              Estimated {isBuy ? 'cost' : 'proceeds'}
            </dt>
            <dd className="font-semibold">
              <CurrencyValue value={preview.totalCad} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-secondary">Cash after trade</dt>
            <dd className="tabular">
              <CurrencyValue value={preview.estimatedCashAfterCad} />
            </dd>
          </div>
          {!isBuy && preview.estimatedRealizedGainLossCad !== undefined ? (
            <div className="flex justify-between">
              <dt className="text-text-secondary">Estimated realized G/L</dt>
              <dd
                className={`tabular ${
                  preview.estimatedRealizedGainLossCad >= 0
                    ? 'text-success'
                    : 'text-danger'
                }`}
              >
                <CurrencyValue
                  value={preview.estimatedRealizedGainLossCad}
                  showSign
                />
              </dd>
            </div>
          ) : null}
        </dl>

        {preview.warnings.length > 0 ? (
          <div className="mt-4 space-y-2">
            {preview.warnings.map((w) => (
              <RiskWarningInline key={w.id} warning={w} />
            ))}
          </div>
        ) : null}

        <p className="mt-4 text-xs text-text-secondary">
          Learn:{' '}
          {isBuy ? (
            <>
              <LearningLink slug={LEARN.STOCK} /> ·{' '}
              <LearningLink slug={LEARN.MARKET_PRICE} /> ·{' '}
              <LearningLink slug={LEARN.FRACTIONAL_SHARES} />
            </>
          ) : (
            <>
              <LearningLink slug={LEARN.REALIZED_GAIN_LOSS} /> ·{' '}
              <LearningLink slug={LEARN.UNREALIZED_GAIN_LOSS} />
            </>
          )}
        </p>

        {errors && errors.length > 0 ? (
          <ul role="alert" className="mt-3 list-disc pl-4 text-sm text-danger">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
              isBuy ? 'bg-accent hover:bg-accent-hover' : 'bg-warning hover:bg-warning/90'
            }`}
          >
            {submitting ? 'Executing…' : isBuy ? 'Confirm Buy' : 'Confirm Sell'}
          </button>
        </div>
      </div>
      </LearningDrawerProvider>
    </dialog>
  );
}
