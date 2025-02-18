import { ArtistPageClient } from '@/components/pages/ArtistPageClient';

// Define the params type as a Promise
interface PageParams {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageParams) {
  // Await the params
  const resolvedParams = await params;
  
  if (!resolvedParams.id || typeof resolvedParams.id !== 'string') {
    throw new Error("Invalid or missing artist ID");
  }

  return <ArtistPageClient id={resolvedParams.id} />;
}