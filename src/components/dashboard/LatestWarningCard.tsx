'use client';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Eyebrow } from '@/components/common/Eyebrow';
import { LearningLink } from '@/components/common/LearningLink';
import {
  selectActiveWarnings,
  useSimulatorStore,
} from '@/store/simulatorStore';
import type { RiskWarning } from '@/types/portfolio';

const SEVERITY_TONE: Record<
  RiskWarning['severity'],
  'info' | 'warning' | 'danger' | 'neutral'
> = {
  INFO: 'info',
  LOW: 'neutral',
  MEDIUM: 'warning',
  HIGH: 'danger',
};

const SEVERITY_RULE: Record<RiskWarning['severity'], string> = {
  INFO: 'border-l-[var(--color-info)]',
  LOW: 'border-l-[var(--color-text-muted)]',
  MEDIUM: 'border-l-[var(--color-warning)]',
  HIGH: 'border-l-[var(--color-danger)]',
};

export function LatestWarningCard() {
  const warnings = useSimulatorStore(selectActiveWarnings);
  const acknowledge = useSimulatorStore((s) => s.acknowledgeWarning);

  if (warnings.length === 0) {
    return (
      <div>
        <Eyebrow>Risk monitor</Eyebrow>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          No active warnings. The portfolio is within healthy concentration,
          sector, and trade-frequency thresholds.
        </p>
      </div>
    );
  }

  const w = warnings[0];

  return (
    <div className={`border-l-2 pl-5 ${SEVERITY_RULE[w.severity]}`}>
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>Latest warning</Eyebrow>
        <Badge tone={SEVERITY_TONE[w.severity]} variant="text">
          {w.severity}
        </Badge>
      </div>
      <h3 className="font-display mt-2 text-xl text-ink">{w.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        {w.message}
      </p>
      {w.relatedLearningSlugs && w.relatedLearningSlugs.length > 0 ? (
        <p className="mt-3 text-xs text-text-muted">
          Read:{' '}
          {w.relatedLearningSlugs.map((slug, i) => (
            <span key={slug}>
              {i > 0 ? ' · ' : ''}
              <LearningLink slug={slug} />
            </span>
          ))}
        </p>
      ) : null}
      <div className="mt-4">
        <Button
          size="xs"
          variant="secondary"
          onClick={() => acknowledge(w.id)}
        >
          Acknowledge
        </Button>
      </div>
      {warnings.length > 1 ? (
        <p className="mt-3 text-xs text-text-muted">
          {warnings.length - 1} more {warnings.length === 2 ? 'warning' : 'warnings'} active
        </p>
      ) : null}
    </div>
  );
}
