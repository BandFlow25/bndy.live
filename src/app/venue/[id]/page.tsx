// src/app/venue/[id]/page.tsx
import { VenuePageClient } from '@/components/pages/VenuePageClient';

interface VenuePageProps {
  params: {
    id: string;
  };
}

export default function VenuePage({ params }: VenuePageProps) {
  return <VenuePageClient id={params.id} />;
}
