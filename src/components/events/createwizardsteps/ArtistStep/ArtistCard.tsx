// src/components/events/steps/ArtistStep/ArtistCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import type { Artist } from '@/lib/types';

interface ArtistCardProps {
    artist: Artist;
    onSelect: (artist: Artist) => void;
}

export function ArtistCard({ artist, onSelect }: ArtistCardProps) {
    return (
        <Card
            className="mb-2 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onSelect(artist)}
        >
            <CardContent className="p-4">
                <div className="flex flex-col gap-1">
                    <h3 className="font-semibold">{artist.name}</h3>
                    {artist.websiteUrl && (
                        <p className="text-xs text-muted-foreground">
                            {artist.websiteUrl}
                        </p>
                    )}
                    <div className="flex gap-2 text-xs text-muted-foreground">
                        {artist.facebookUrl && <span>Facebook</span>}
                        {artist.instagramUrl && <span>Instagram</span>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}