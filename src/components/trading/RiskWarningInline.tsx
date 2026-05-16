import { LearningLink } from '@/components/common/LearningLink';
import { RiskPill } from '@/components/common/RiskPill';
import type { RiskWarning } from '@/types/portfolio';

export function RiskWarningInline({ warning }: { warning: RiskWarning }) {
  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
      <div className="flex items-center gap-2">
        <RiskPill severity={warning.severity}>{warning.title}</RiskPill>
      </div>
      <p className="mt-1 text-text-secondary">{warning.message}</p>
      {warning.relatedLearningSlugs && warning.relatedLearningSlugs.length > 0 ? (
        <p className="mt-2 text-xs">
          Learn:{' '}
          {warning.relatedLearningSlugs.map((slug, i) => (
            <span key={slug}>
              {i > 0 ? ' · ' : ''}
              <LearningLink openInNewTab slug={slug} />
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
