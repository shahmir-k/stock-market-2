'use client';

import { useEffect, useRef } from 'react';

import { Button } from '@/components/common/Button';
import { CurrencyValue } from '@/components/common/CurrencyValue';
import { Eyebrow } from '@/components/common/Eyebrow';
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
      // Double-bezel: outer warm dust shell, inner white core. Concentric
      // radii from high-end-visual-design § 4A.
      className="fade-up rounded-[1rem] bg-[var(--color-surface-muted)] p-1.5 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.18)] backdrop:bg-ink/30"
    >
      <LearningDrawerProvider>
        <div className="rounded-[calc(1rem-0.375rem)] border rule bg-surface">
          <div className="w-[34rem] max-w-[calc(100vw-2.5rem)] p-8">
            {/* Header */}
            <Eyebrow>{isBuy ? 'Confirm buy' : 'Confirm sell'}</Eyebrow>
            <h2 className="font-display mt-2 text-2xl text-ink">
              {preview.symbol}
              <span className="text-text-muted"> · {preview.assetName}</span>
            </h2>

            {/* Definition list — hairline rows, no boxed dl */}
            <dl className="mt-6 divide-y rule border-y">
              <Row label="Price">
                <span className="tabular">
                  {preview.priceNative.toFixed(2)} {preview.nativeCurrency}
                </span>
              </Row>
              {preview.nativeCurrency !== 'CAD' && (
                <Row label="FX rate">
                  <span className="tabular">{preview.fxRateToCad.toFixed(4)}</span>
                </Row>
              )}
              <Row label="Quantity">
                <span className="tabular">{preview.quantity}</span>
              </Row>
              <Row label={`Estimated ${isBuy ? 'cost' : 'proceeds'}`}>
                <span className="tabular text-ink">
                  <CurrencyValue value={preview.totalCad} />
                </span>
              </Row>
              <Row label="Cash after trade">
                <span className="tabular">
                  <CurrencyValue value={preview.estimatedCashAfterCad} />
                </span>
              </Row>
              {!isBuy && preview.estimatedRealizedGainLossCad !== undefined ? (
                <Row label="Estimated realized G/L">
                  <span
                    className={`tabular ${
                      preview.estimatedRealizedGainLossCad >= 0
                        ? 'text-[var(--color-success)]'
                        : 'text-[var(--color-danger)]'
                    }`}
                  >
                    <CurrencyValue
                      value={preview.estimatedRealizedGainLossCad}
                      showSign
                    />
                  </span>
                </Row>
              ) : null}
            </dl>

            {/* Inline warnings */}
            {preview.warnings.length > 0 ? (
              <div className="mt-6 space-y-4">
                {preview.warnings.map((w) => (
                  <RiskWarningInline key={w.id} warning={w} />
                ))}
              </div>
            ) : null}

            {/* Learning links — inside the drawer provider, so clicks open
                the right-side drawer rather than navigating */}
            <p className="mt-6 text-xs text-text-muted">
              Read:{' '}
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
              <ul role="alert" className="mt-4 list-disc pl-4 text-sm text-[var(--color-danger)]">
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            ) : null}

            <div className="mt-8 flex justify-end gap-2 border-t rule pt-5">
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={onConfirm}
                loading={submitting}
              >
                {isBuy ? 'Confirm buy' : 'Confirm sell'}
              </Button>
            </div>
          </div>
        </div>
      </LearningDrawerProvider>
    </dialog>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 text-sm">
      <dt className="text-text-secondary">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
