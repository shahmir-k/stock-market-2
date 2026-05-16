export function EmptyState({
  title,
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
      {title ? (
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      ) : null}
      <p className="mt-1 text-sm text-text-secondary">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
