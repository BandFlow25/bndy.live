import { VenuePageClient } from '@/components/pages/VenuePageClient';

export default function VenuePage({ params }: { params: Record<string, string> }) {
  return <VenuePageClient id={params.id} />;
}