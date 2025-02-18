// src/components/events/steps/ArtistStep.tsx
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Plus, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { searchArtists, createArtist, type NewArtist } from '@/lib/services/artist-service';
import type { Artist } from '@/lib/types';
import type { EventFormData } from '@/lib/types';
import { stringSimilarity } from '@/lib/utils/string-similarity';

interface ArtistStepProps {
  form: UseFormReturn<EventFormData>;
  multipleMode: boolean;
  onArtistSelect?: (artist: Artist) => void;
  onNext?: () => void;
  onBack?: () => void;
}

export function ArtistStep({
  form,
  multipleMode,
  onArtistSelect,
  onNext,
  onBack
}: ArtistStepProps) {
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewArtistForm, setShowNewArtistForm] = useState(false);
  const [newArtist, setNewArtist] = useState<NewArtist>({
    name: ''
  });
  const [similarArtists, setSimilarArtists] = useState<Artist[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchTerm: string) => {
    setSearchTerm(searchTerm);
    if (searchTerm.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    try {
      const results = await searchArtists(searchTerm);
      setSearchResults(results);
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching artists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewArtist = async () => {
    if (!newArtist.name) return;

    // Check for exact name match
    const exactMatch = searchResults.find(
      artist => artist.name.toLowerCase() === newArtist.name.toLowerCase()
    );
    if (exactMatch) {
      alert('An artist with this exact name already exists');
      return;
    }

    setLoading(true);
    try {
      const createdArtist = await createArtist(newArtist);

      if (!multipleMode) {
        form.setValue('artists', [createdArtist]);
        onArtistSelect?.(createdArtist);
      } else {
        const currentArtists = form.getValues('artists');
        form.setValue('artists', [...currentArtists, createdArtist]);
      }

      // Reset form
      setNewArtist({ name: '' });
      setShowNewArtistForm(false);
      setSearchTerm('');
      setSearchResults([]);
      setHasSearched(false);
    } catch (error) {
      console.error('Error creating artist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArtist = (artist: Artist) => {
    if (!multipleMode) {
      form.setValue('artists', [artist]);
      onArtistSelect?.(artist);
    } else {
      const currentArtists = form.getValues('artists');
      if (!currentArtists.some(a => a.id === artist.id)) {
        form.setValue('artists', [...currentArtists, artist]);
      }
    }
  };

  const handleRemoveArtist = (artistId: string) => {
    const currentArtists = form.getValues('artists');
    form.setValue('artists', currentArtists.filter((artist: Artist) => artist.id !== artistId));
  };

  return (
    <div className="space-y-4">
      {/* New Artist Form */}
      {showNewArtistForm ? (
        <Card className="border-primary">
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Add New Artist</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewArtistForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Artist Name *"
              value={newArtist.name}
              onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })}
              className="mb-2"
            />

            {similarArtists.length > 0 && (
              <div className="p-2 bg-yellow-500/10 rounded-md border border-yellow-500/50">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-yellow-500 font-medium">Similar artists found:</p>
                    <ul className="mt-1 text-sm text-muted-foreground">
                      {similarArtists.map(artist => (
                        <li key={artist.id}>{artist.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <Input
              placeholder="Facebook URL"
              value={newArtist.facebookUrl || ''}
              onChange={(e) => setNewArtist({ ...newArtist, facebookUrl: e.target.value })}
              className="mb-2"
            />
            <Input
              placeholder="Instagram URL"
              value={newArtist.instagramUrl || ''}
              onChange={(e) => setNewArtist({ ...newArtist, instagramUrl: e.target.value })}
              className="mb-2"
            />
            <Input
              placeholder="Website URL"
              value={newArtist.websiteUrl || ''}
              onChange={(e) => setNewArtist({ ...newArtist, websiteUrl: e.target.value })}
              className="mb-2"
            />
            <Button
              onClick={handleAddNewArtist}
              disabled={!newArtist.name || loading}
              className="w-full"
            >
              Save New Artist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search Section */}
          <Input
            placeholder="Search for artists..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />

          <ScrollArea className={multipleMode ? "h-[300px]" : "h-[400px]"}>
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Searching artists...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((artist) => (
                <Card
                  key={artist.id}
                  className="mb-2 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSelectArtist(artist)}
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
              ))
            ) : hasSearched && searchTerm.length >= 2 ? (
              <div className="p-4 text-center space-y-4">
                <p className="text-muted-foreground">No artists found</p>
                <Button
                  variant="outline"
                  onClick={() => setShowNewArtistForm(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Artist
                </Button>
              </div>
            ) : null}
          </ScrollArea>
        </>
      )}

      {/* Selected Artists Section (Only shown in multiple mode) */}
      {multipleMode && form.watch('artists').length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Selected Artists</h4>
          {form.watch('artists').map((artist: Artist, index: number) => (
            <div key={artist.id || index} className="flex items-center justify-between p-2 bg-accent rounded mb-2">
              <span>{artist.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveArtist(artist.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Buttons (Only shown in multiple mode) */}
      {multipleMode && (
        <div className="flex gap-4">
          <Button variant="outline" className="w-full" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            className="w-full"
            disabled={form.watch('artists').length === 0}
            onClick={onNext}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}