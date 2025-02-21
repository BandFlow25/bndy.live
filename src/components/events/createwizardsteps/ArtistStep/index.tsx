// src/components/events/steps/ArtistStep/index.tsx
import { useState, useEffect, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { searchArtists } from '@/lib/services/artist-service';
import type { Artist, EventFormData } from '@/lib/types';
import { ArtistCard } from './ArtistCard';
import { NewArtistForm } from './NewArtistForm';

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
    const [hasSearched, setHasSearched] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isOpenMic = form.watch('isOpenMic');

    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

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

    const handleArtistSelect = (artist: Artist) => {
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
        form.setValue('artists', currentArtists.filter(artist => artist.id !== artistId));
    };

    return (
        <div className="space-y-4">
            {/* Event Type Options */}
            <Card className="mb-4">
                <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isOpenMic"
                            checked={form.watch('isOpenMic')}
                            onCheckedChange={(checked: boolean) => {
                                form.setValue('isOpenMic', checked);
                                if (checked) {
                                    form.setValue('artists', []);
                                    onNext();
                                }
                            }}
                        />
                        <Label htmlFor="isOpenMic">This is an Open Mic event</Label>
                    </div>
    
                    {!form.watch('isOpenMic') && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="multipleArtists"
                                checked={multipleMode}
                                onCheckedChange={(checked: boolean) => {
                                    if (!checked) {
                                        form.setValue('artists', []);
                                    }
                                }}
                            />
                            <Label htmlFor="multipleArtists">List Multiple Artists?</Label>
                        </div>
                    )}
                </CardContent>
            </Card>
    
            {/* Artist Selection - Only show if not Open Mic */}
            {!form.watch('isOpenMic') && (
                <>
                    {!showNewArtistForm ? (
                        <>
                            <Input
                                ref={searchInputRef}
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
                                        <ArtistCard
                                            key={artist.id}
                                            artist={artist}
                                            onSelect={handleArtistSelect}
                                        />
                                    ))
                                ) : hasSearched && searchTerm.length >= 2 ? (
                                    <div className="p-4 text-center space-y-4">
                                        <p className="text-muted-foreground">No artists found</p>
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowNewArtistForm(true)}
                                        >
                                            Add New Artist
                                        </Button>
                                    </div>
                                ) : null}
                            </ScrollArea>
                        </>
                    ) : (
                        <NewArtistForm
                            initialName={searchTerm}
                            onCancel={() => setShowNewArtistForm(false)}
                            onArtistCreated={(artist) => {
                                handleArtistSelect(artist);
                                setShowNewArtistForm(false);
                            }}
                            existingArtists={searchResults}
                        />
                    )}
    
                    {multipleMode && form.watch('artists').length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-medium mb-2">Selected Artists</h4>
                            {form.watch('artists').map((artist: Artist) => (
                                <div key={artist.id} className="flex items-center justify-between p-2 bg-accent rounded mb-2">
                                    <span>{artist.name}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveArtist(artist.id)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
    
                    {multipleMode && (
                        <div className="flex gap-4">
                            <Button variant="outline" className="w-full" onClick={onBack}>
                                Back
                            </Button>
                            <Button
                                className="w-full"
                                disabled={form.watch('artists').length === 0}
                                onClick={onNext}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}