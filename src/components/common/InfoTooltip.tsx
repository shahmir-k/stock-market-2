// Minimal tooltip — uses native `title` for MVP. Replace with positioned
// floating UI later if hover discoverability matters.

export function InfoTooltip({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) {
  return (
    <span className="inline-flex items-center" title={text}>
      {children}
      <span
        aria-hidden
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-surface-muted text-[10px] font-semibold text-text-secondary"
      >
        ?
      </span>
    </span>
  );
}
