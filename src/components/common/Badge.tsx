// Single Badge component that replaces AssetTypeBadge, QuoteStatusBadge,
// RiskPill, and ad-hoc inline status text. Tone-only pastels per
// minimalist-ui §4. Two visual sizes (sm pill / xs text-only).

type Tone = 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'accent';
type Variant = 'soft' | 'outline' | 'text';

const toneClasses: Record<Tone, { soft: string; outline: string; text: string }> = {
  neutral: {
    soft: 'bg-surface-muted text-text-secondary',
    outline: 'rule border text-text-secondary',
    text: 'text-text-secondary',
  },
  success: {
    soft: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    outline: 'border border-[var(--color-success)]/30 text-[var(--color-success)]',
    text: 'text-[var(--color-success)]',
  },
  danger: {
    soft: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
    outline: 'border border-[var(--color-danger)]/30 text-[var(--color-danger)]',
    text: 'text-[var(--color-danger)]',
  },
  warning: {
    soft: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
    outline: 'border border-[var(--color-warning)]/30 text-[var(--color-warning)]',
    text: 'text-[var(--color-warning)]',
  },
  info: {
    soft: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    outline: 'border border-[var(--color-info)]/30 text-[var(--color-info)]',
    text: 'text-[var(--color-info)]',
  },
  accent: {
    soft: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
    outline: 'border border-[var(--color-accent)]/30 text-[var(--color-accent)]',
    text: 'text-[var(--color-accent)]',
  },
};

export function Badge({
  tone = 'neutral',
  variant = 'soft',
  className = '',
  children,
}: {
  tone?: Tone;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  const base =
    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em]';
  if (variant === 'text') {
    return (
      <span className={`text-xs font-medium ${toneClasses[tone].text} ${className}`}>
        {children}
      </span>
    );
  }
  return (
    <span className={`${base} ${toneClasses[tone][variant]} ${className}`}>
      {children}
    </span>
  );
}
