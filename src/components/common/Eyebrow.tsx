// Wide-tracking uppercase label that sits above section headings or
// alongside hero KPI values. Editorial convention — never used standalone
// (always paired with a larger element below it).

export function Eyebrow({
  children,
  className = '',
  as: As = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'span' | 'p';
}) {
  return <As className={`eyebrow ${className}`}>{children}</As>;
}
