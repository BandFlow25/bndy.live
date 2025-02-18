import { ArtistPageClient } from '@/components/pages/ArtistPageClient';
import { Metadata } from 'next';

type PageProps = {
  params: { id: string };
};

export const metadata: Metadata = {
  title: 'Artist Page',
};

export default function ArtistPage({ params }: PageProps) {
  return <ArtistPageClient id={params.id} />;
}
