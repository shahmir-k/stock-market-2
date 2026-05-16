import { Badge } from '@/components/common/Badge';
import { LearningLink } from '@/components/common/LearningLink';
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

export function RiskWarningInline({ warning }: { warning: RiskWarning }) {
  return (
    <div className={`border-l-2 pl-4 py-1 ${SEVERITY_RULE[warning.severity]}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-ink">{warning.title}</p>
        <Badge tone={SEVERITY_TONE[warning.severity]} variant="text">
          {warning.severity}
        </Badge>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-text-secondary">
        {warning.message}
      </p>
      {warning.relatedLearningSlugs && warning.relatedLearningSlugs.length > 0 ? (
        <p className="mt-2 text-xs text-text-muted">
          Read:{' '}
          {warning.relatedLearningSlugs.map((slug, i) => (
            <span key={slug}>
              {i > 0 ? ' · ' : ''}
              <LearningLink slug={slug} />
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
