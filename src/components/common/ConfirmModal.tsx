'use client';

import { useEffect, useRef } from 'react';

import { Button } from './Button';
import { Eyebrow } from './Eyebrow';

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      className="fade-up rounded-[var(--radius-modal)] border rule bg-surface p-0 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.12)] backdrop:bg-ink/30"
    >
      <div className="w-[28rem] max-w-[calc(100vw-2rem)] p-8">
        <Eyebrow>{destructive ? 'Confirm action' : 'Confirm'}</Eyebrow>
        <h2 className="font-display mt-2 text-2xl text-ink">{title}</h2>
        {description ? (
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-8 flex justify-end gap-2 border-t rule pt-5">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className={
              destructive
                ? 'bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/85'
                : ''
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
