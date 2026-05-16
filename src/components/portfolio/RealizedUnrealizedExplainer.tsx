import { CurrencyValue } from '@/components/common/CurrencyValue';
import { LearningLink } from '@/components/common/LearningLink';
import { LEARN } from '@/lib/learning';

export function RealizedUnrealizedExplainer({
  realizedCad,
  unrealizedCad,
}: {
  realizedCad: number;
  unrealizedCad: number;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
      <div>
        <div className="text-xs uppercase tracking-wide text-text-muted">
          <LearningLink slug={LEARN.REALIZED_GAIN_LOSS}>
            Realized G/L
          </LearningLink>
        </div>
        <div
          className={`mt-1 text-xl font-bold tabular ${
            realizedCad >= 0 ? 'text-success' : 'text-danger'
          }`}
        >
          <CurrencyValue value={realizedCad} showSign />
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          Locked in when you sell.
        </p>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-text-muted">
          <LearningLink slug={LEARN.UNREALIZED_GAIN_LOSS}>
            Unrealized G/L
          </LearningLink>
        </div>
        <div
          className={`mt-1 text-xl font-bold tabular ${
            unrealizedCad >= 0 ? 'text-success' : 'text-danger'
          }`}
        >
          <CurrencyValue value={unrealizedCad} showSign />
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          Changes as prices move on holdings you still own.
        </p>
      </div>
    </div>
  );
}
