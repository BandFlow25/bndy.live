// src/app/artist/[id]/page.tsx
import { ArtistPageClient } from '@/components/pages/ArtistPageClient';

export default function ArtistPage({ params }: { params: { id: string } }) {
  return <ArtistPageClient id={params.id} />;
}