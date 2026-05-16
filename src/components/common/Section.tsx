// Replaces the boxed `rounded-2xl border bg-surface p-6` pattern with the
// editorial "rule-and-whitespace" treatment: an optional hairline rule above,
// generous vertical padding, no surrounding box. Heading + eyebrow live
// inside as props or children.

import { Eyebrow } from './Eyebrow';

export function Section({
  children,
  className = '',
  title,
  eyebrow,
  action,
  rule = true,
  size = 'md',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  eyebrow?: React.ReactNode;
  action?: React.ReactNode;
  /** Hairline rule above the section (default true). */
  rule?: boolean;
  /** Vertical padding scale. */
  size?: 'sm' | 'md' | 'lg';
  id?: string;
}) {
  const padding =
    size === 'sm' ? 'py-8' : size === 'lg' ? 'py-16 md:py-20' : 'py-10 md:py-12';
  const ruleStyle = rule ? 'border-t pt-8 md:pt-10' : '';

  return (
    <section
      id={id}
      className={`${padding} ${ruleStyle} ${rule ? 'rule' : ''} ${className}`}
    >
      {(eyebrow || title || action) && (
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && (
              <h2 className="mt-2 font-display text-2xl md:text-3xl text-ink">
                {title}
              </h2>
            )}
          </div>
          {action && <div className="text-sm">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
