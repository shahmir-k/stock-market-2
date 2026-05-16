import Link from 'next/link';

import { EmptyState } from '@/components/common/EmptyState';

export default function LearnNotFound() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/learn"
        className="text-sm text-text-secondary hover:text-text-primary"
      >
        ← Back to Learn
      </Link>
      <EmptyState
        title="Term not found"
        message="That learning term doesn't exist. Browse all terms or use the search on the Learn page."
        action={
          <Link
            href="/learn"
            className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Browse all terms
          </Link>
        }
      />
    </div>
  );
}
