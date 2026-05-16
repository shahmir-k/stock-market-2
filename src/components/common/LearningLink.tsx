// Inline link to a learning term. Behavior switches based on context:
//   - Inside <LearningDrawerProvider> (i.e. inside a trade modal): clicking
//     opens a right-side drawer so the modal stays mounted and the trade
//     input is preserved (PRD §31.3).
//   - Outside that provider: navigates to /learn/[slug] like a regular link.
// `openInNewTab` is a legacy escape hatch — prefer letting the drawer pick
// it up automatically.

'use client';

import Link from 'next/link';

import { useLearningDrawer } from '@/components/learn/LearningDrawer';
import { getTermBySlug } from '@/lib/learning';

export function LearningLink({
  slug,
  children,
  className = '',
  openInNewTab = false,
}: {
  slug: string;
  children?: React.ReactNode;
  className?: string;
  openInNewTab?: boolean;
}) {
  const drawer = useLearningDrawer();
  const term = getTermBySlug(slug);
  const label = children ?? term?.title ?? slug;
  const cls = `text-info underline-offset-2 hover:underline ${className}`;

  if (drawer) {
    return (
      <button
        type="button"
        onClick={() => drawer.openDrawer(slug)}
        className={cls}
      >
        {label}
      </button>
    );
  }
  if (openInNewTab) {
    return (
      <a
        href={`/learn/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
      >
        {label}
      </a>
    );
  }
  return (
    <Link href={`/learn/${slug}`} className={cls}>
      {label}
    </Link>
  );
}
