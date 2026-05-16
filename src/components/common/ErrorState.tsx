export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-danger/30 bg-danger/5 p-6"
    >
      <h3 className="text-base font-semibold text-danger">{title}</h3>
      <p className="mt-1 text-sm text-text-secondary">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
