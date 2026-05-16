'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { LearningTermDetail } from './LearningTermDetail';
import { getTermBySlug } from '@/lib/learning';

// When this context is non-null, in-page learning links route through the
// drawer instead of navigating. Used inside trade modals so the trade input
// is preserved (PRD §31.3).
type LearningDrawerCtx = {
  openDrawer: (slug: string) => void;
};

const LearningDrawerContext = createContext<LearningDrawerCtx | null>(null);

export function useLearningDrawer(): LearningDrawerCtx | null {
  return useContext(LearningDrawerContext);
}

export function LearningDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const openDrawer = useCallback((slug: string) => {
    setOpenSlug(slug);
  }, []);

  const closeDrawer = useCallback(() => {
    setOpenSlug(null);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (openSlug && !dialog.open) dialog.showModal();
    else if (!openSlug && dialog.open) dialog.close();
  }, [openSlug]);

  const term = openSlug ? getTermBySlug(openSlug) : null;

  return (
    <LearningDrawerContext.Provider value={{ openDrawer }}>
      {children}
      <dialog
        ref={dialogRef}
        onClose={closeDrawer}
        // Position as a right-side panel via the dialog's default
        // positioning + margin override. The :modal pseudo-class centers
        // the dialog by default; we explicitly stick it to the right.
        className="fixed right-0 top-0 ml-auto mr-0 h-screen max-h-screen w-[28rem] max-w-[calc(100vw-2rem)] rounded-none border-l border-border bg-surface p-0 shadow-2xl backdrop:bg-slate-900/40"
        aria-label="Learning term"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
              Learn
            </h2>
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close"
              className="rounded-md p-1 text-text-secondary hover:bg-surface-muted hover:text-text-primary"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {term ? (
              <LearningTermDetail term={term} />
            ) : (
              <p className="text-sm text-text-secondary">Term not found.</p>
            )}
          </div>
        </div>
      </dialog>
    </LearningDrawerContext.Provider>
  );
}
