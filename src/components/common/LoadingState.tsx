export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-text-secondary"
    >
      {message}
    </div>
  );
}
