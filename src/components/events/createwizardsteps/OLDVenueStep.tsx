// src\components\events\createwizardsteps\VenueStep.tsx
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchVenues, createVenue } from '@/lib/services/venue-service';
import { BndyBLogo } from '@/components/ui/bndyblogo';
import { Building } from 'lucide-react';
import type { EventFormData } from '@/lib/types';
import type { Venue } from '@/lib/types';

interface VenueStepProps {
  map: google.maps.Map;
  form: UseFormReturn<EventFormData>;
  onVenueSelect: (venue: Venue) => void;
  onComplete?: () => void;  // Add this
}

export function VenueStep({ map, form, onVenueSelect, onComplete }: VenueStepProps) {
  const [searchResults, setSearchResults] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchTerm: string) => {
    setLoading(true);
    try {
      const results = await searchVenues(searchTerm, map);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVenueSelect = async (venue: Venue) => {
    try {
        let selectedVenue = venue;
        form.setValue('venue', selectedVenue);
        
        // Call appropriate callback
        onVenueSelect?.(selectedVenue);
        onComplete?.();
    } catch (error) {
        console.error('Error handling venue selection:', error);
    }
};

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search for venue... (e.g., 'The Swan Stone' or 'Underground Hanley')"
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
            <Card
              key={venue.id || `new-${index}`}
              className="mb-2 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handleVenueSelect(venue)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{venue.name}</h3>
                    {venue.address && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {venue.address}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {venue.id ? (
                        <>
                          
                          <span className="text-xs text-primary">Verified venue</span>
                        </>
                      ) : (
                        <>
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            New venue - will be added to database
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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