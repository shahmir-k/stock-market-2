import Link from 'next/link';

import { Button } from '@/components/common/Button';
import { Eyebrow } from '@/components/common/Eyebrow';

export default function LearnNotFound() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        href="/learn"
        className="text-sm text-text-secondary hover:text-ink transition-colors duration-[var(--dur-fast)]"
      >
        ← Back to glossary
      </Link>
      <div>
        <Eyebrow>Not found</Eyebrow>
        <h1 className="font-display mt-3 text-4xl tracking-tight text-ink">
          That term doesn&apos;t exist.
        </h1>
        <p className="mt-3 max-w-prose text-base leading-relaxed text-text-secondary">
          The URL may be mistyped or the term may have been removed. Browse the
          full 30-term glossary to find what you&apos;re looking for.
        </p>
        <div className="mt-6">
          <Link href="/learn">
            <Button variant="primary" size="md">
              Browse the glossary →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
