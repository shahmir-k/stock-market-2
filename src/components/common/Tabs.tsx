// Underline-active tab pattern. No boxed buttons — text only with a 2px
// accent underline under the active item. Sliding underline on hover for
// non-active items. Used by /compound-growth and /learn.

export type TabItem<T extends string> = {
  id: T;
  label: React.ReactNode;
};

export function Tabs<T extends string>({
  items,
  active,
  onChange,
  size = 'md',
  className = '',
}: {
  items: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const text = size === 'sm' ? 'text-sm' : 'text-base';
  return (
    <div
      role="tablist"
      className={`flex flex-wrap items-end gap-x-6 gap-y-2 border-b rule ${className}`}
    >
      {items.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={`relative -mb-px py-2 ${text} font-medium transition-colors duration-[var(--dur-fast)] ${
              isActive ? 'text-ink' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t.label}
            <span
              className={`absolute -bottom-px left-0 right-0 h-[2px] transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] ${
                isActive
                  ? 'bg-[var(--color-accent)] scale-x-100'
                  : 'bg-[var(--color-accent)] scale-x-0'
              } origin-left`}
            />
          </button>
        );
      })}
    </div>
  );
}
