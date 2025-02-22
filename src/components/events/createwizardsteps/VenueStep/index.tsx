// src/components/events/steps/VenueStep/index.tsx
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchVenues } from '@/lib/services/venue-service';
import type { EventFormData, Venue } from '@/lib/types';
import { VenueCard } from './VenueCard';

interface VenueStepProps {
    form: UseFormReturn<EventFormData>;
    map: google.maps.Map;
    onVenueSelect: (venue: Venue) => void;
  }

export function VenueStep({ form, map, onVenueSelect }: VenueStepProps) {
    const [searchResults, setSearchResults] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (searchTerm: string) => {
        if (!searchTerm || searchTerm.length < 2) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        try {
            const results = await searchVenues(searchTerm);
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching venues:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVenueSelect = (venue: Venue) => {
     
        onVenueSelect(venue);
        
      };

    return (
        <div className="space-y-4">
            <Input
                placeholder="Search for venue..."
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
            />
            
            <ScrollArea className="h-[400px]">
                {loading ? (
                    <div className="p-4 text-center text-muted-foreground">
                        Searching venues...
                    </div>
                ) : searchResults.length > 0 ? (
                    searchResults.map((venue, index) => (
                        <VenueCard
                            key={venue.id || `new-${index}`}
                            venue={venue}
                            onSelect={handleVenueSelect}
                        />
                    ))
                ) : (
                    <div className="p-4 text-center text-muted-foreground">
                        Start typing to search for venues
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}