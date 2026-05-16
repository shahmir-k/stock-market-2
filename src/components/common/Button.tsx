// Three variants — primary (filled ink), secondary (hairline ghost), link
// (text-only). All share the tactile :active scale of 0.98 per the skill
// motion rules. Sizes range from xs through lg. Loading state included.

import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'link';
type Size = 'xs' | 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
    'bg-ink text-canvas hover:bg-[#2a2520] active:scale-[0.98] disabled:opacity-50',
  secondary:
    'rule border bg-canvas text-ink hover:bg-surface-muted active:scale-[0.98] disabled:opacity-50',
  link: 'text-ink underline-offset-4 hover:underline disabled:opacity-50',
};

const sizes: Record<Size, string> = {
  xs: 'px-2.5 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', loading, className = '', children, ...rest },
    ref,
  ) {
    const cls =
      `inline-flex items-center justify-center gap-2 rounded-[6px] font-medium transition-all duration-[var(--dur-fast)] ease-[var(--ease-out-expo)] ` +
      `${variants[variant]} ${sizes[size]} ${className}`;
    return (
      <button ref={ref} className={cls} disabled={loading || rest.disabled} {...rest}>
        {loading ? <span className="opacity-60">Working…</span> : children}
      </button>
    );
  },
);
