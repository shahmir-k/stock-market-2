'use client';

import { LearningLink } from '@/components/common/LearningLink';
import { RiskPill } from '@/components/common/RiskPill';
import {
  selectActiveWarnings,
  useSimulatorStore,
} from '@/store/simulatorStore';

export function LatestWarningCard() {
  const warnings = useSimulatorStore(selectActiveWarnings);
  const acknowledge = useSimulatorStore((s) => s.acknowledgeWarning);

  if (warnings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-base font-semibold">Latest Warning / Tip</h2>
        <p className="mt-2 text-sm text-text-secondary">
          No active warnings. Your portfolio looks healthy.
        </p>
      </div>
    );
  }

  const w = warnings[0];

  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Latest Warning</h2>
        <RiskPill severity={w.severity}>{w.severity}</RiskPill>
      </div>
      <h3 className="mt-2 font-semibold text-text-primary">{w.title}</h3>
      <p className="mt-1 text-sm text-text-secondary">{w.message}</p>
      {w.relatedLearningSlugs && w.relatedLearningSlugs.length > 0 ? (
        <p className="mt-2 text-xs">
          Learn:{' '}
          {w.relatedLearningSlugs.map((slug, i) => (
            <span key={slug}>
              {i > 0 ? ' · ' : ''}
              <LearningLink slug={slug} />
            </span>
          ))}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => acknowledge(w.id)}
        className="mt-3 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-muted"
      >
        Acknowledge
      </button>
    </div>
  );
}
