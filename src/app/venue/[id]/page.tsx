import { VenuePageClient } from '@/components/pages/VenuePageClient';
import { Metadata } from 'next';

type PageProps = {
  params: { id: string };
};

export const metadata: Metadata = {
  title: 'Venue Page',
};

export default function VenuePage({ params }: PageProps) {
  return <VenuePageClient id={params.id} />;
}
