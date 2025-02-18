import { VenuePageClient } from '@/components/pages/VenuePageClient';

type PageProps = {
  params: { id: string };
};

export default function VenuePage({ params }: PageProps) {
  if (!params?.id) {
    throw new Error("Missing venue ID in params");
  }

  return <VenuePageClient id={params.id} />;
}
