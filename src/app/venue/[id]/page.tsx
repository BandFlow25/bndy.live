import { VenuePageClient } from '@/components/pages/VenuePageClient';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageParams) {
  const resolvedParams = await params;
  
  if (!resolvedParams.id || typeof resolvedParams.id !== 'string') {
    throw new Error("Invalid or missing venue ID");
  }

  return <VenuePageClient id={resolvedParams.id} />;
}