// Display a CAD currency value rounded to 2 decimals (PRD §18.8).

const formatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function CurrencyValue({
  value,
  className = '',
  showSign = false,
}: {
  value: number;
  className?: string;
  showSign?: boolean;
}) {
  if (!Number.isFinite(value)) {
    return <span className={`tabular ${className}`}>—</span>;
  }
  const sign = showSign && value > 0 ? '+' : '';
  return (
    <span className={`tabular ${className}`}>
      {sign}
      {formatter.format(value)}
    </span>
  );
}
