// src/app/venue/[id]/page.tsx
import { VenuePageClient } from '@/components/pages/VenuePageClient';

export default function Page({ params }: { params: { id: string } }) {
  return <VenuePageClient id={params.id} />;
}