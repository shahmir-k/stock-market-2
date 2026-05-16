import Link from 'next/link';
import { notFound } from 'next/navigation';

import { LearningTermDetail } from '@/components/learn/LearningTermDetail';
import { getTermBySlug } from '@/lib/learning';

export default async function TermDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const term = getTermBySlug(slug);
  if (!term) {
    notFound();
  }
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <Link
        href="/learn"
        className="text-sm text-text-secondary hover:text-ink transition-colors duration-[var(--dur-fast)]"
      >
        ← Back to glossary
      </Link>
      <LearningTermDetail term={term} />
    </div>
  );
}
