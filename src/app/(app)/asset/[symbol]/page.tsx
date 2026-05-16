import { AssetDetailClient } from '@/components/asset/AssetDetailClient';

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  return <AssetDetailClient symbol={decodeURIComponent(symbol)} />;
}
