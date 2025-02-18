import { ArtistPageClient } from '@/components/pages/ArtistPageClient';

type PageProps = {
  params: { id: string };
};

export default function ArtistPage({ params }: PageProps) {
  if (!params?.id) {
    throw new Error("Missing artist ID in params");
  }

  return <ArtistPageClient id={params.id} />;
}
