// Headline metric tile. Used by Dashboard and Portfolio summary rows.

export function MetricCard({
  label,
  value,
  hint,
  className = '',
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6 ${className}`}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-text-primary md:text-3xl">
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-text-secondary">{hint}</div>
      ) : null}
    </div>
  );
}
