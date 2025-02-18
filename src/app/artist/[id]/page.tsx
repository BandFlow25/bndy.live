import { ArtistPageClient } from '@/components/pages/ArtistPageClient';

export default function ArtistPage({ params }: { params: Record<string, string> }) {
  return <ArtistPageClient id={params.id} />;
}