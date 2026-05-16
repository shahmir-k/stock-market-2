// Reusable Modal primitive built on the native <dialog> element. Editorial
// styling: thin elevation, double-bezel for the most important surfaces,
// fade-up entrance, generous padding. Used by trade confirmation, reset,
// mode-switch, learning drawer (sister component).

'use client';

import { useEffect, useRef } from 'react';

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  size = 'md',
  bezel = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  eyebrow?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** If true, wrap with double-bezel (outer cream shell + inner white core). */
  bezel?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const widths = {
    sm: 'w-[24rem]',
    md: 'w-[32rem]',
    lg: 'w-[44rem]',
  };

  const inner = (
    <div className={`${widths[size]} max-w-[calc(100vw-2rem)] p-8`}>
      {(eyebrow || title) && (
        <header className="mb-6">
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          {title && (
            <h2 className="font-display mt-2 text-2xl text-ink">{title}</h2>
          )}
        </header>
      )}
      <div className="text-sm">{children}</div>
      {footer && (
        <footer className="mt-8 flex justify-end gap-2 rule border-t pt-5">
          {footer}
        </footer>
      )}
    </div>
  );

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={`fade-up bg-transparent p-0 backdrop:bg-ink/30 ${
        bezel
          ? 'rounded-[1rem] bg-[var(--color-surface-muted)] p-1.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.12)]'
          : 'rounded-[var(--radius-modal)] bg-surface shadow-[0_30px_80px_-20px_rgba(0,0,0,0.12)] rule border'
      }`}
    >
      {bezel ? (
        <div className="rounded-[calc(1rem-0.375rem)] bg-surface rule border">
          {inner}
        </div>
      ) : (
        inner
      )}
    </dialog>
  );
}
