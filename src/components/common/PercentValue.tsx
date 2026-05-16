export function PercentValue({
  value,
  className = '',
  showSign = false,
  decimals = 2,
}: {
  value: number;
  className?: string;
  showSign?: boolean;
  decimals?: number;
}) {
  if (!Number.isFinite(value)) {
    return <span className={`tabular ${className}`}>—</span>;
  }
  const sign = showSign && value > 0 ? '+' : '';
  return (
    <span className={`tabular ${className}`}>
      {sign}
      {value.toFixed(decimals)}%
    </span>
  );
}
