import type { WarningSeverity } from '@/types/portfolio';

const STYLES: Record<WarningSeverity, string> = {
  INFO: 'bg-info/10 text-info',
  LOW: 'bg-success/10 text-success',
  MEDIUM: 'bg-warning/15 text-warning',
  HIGH: 'bg-danger/10 text-danger',
};

export function RiskPill({
  severity,
  children,
}: {
  severity: WarningSeverity;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[severity]}`}
    >
      {children}
    </span>
  );
}
