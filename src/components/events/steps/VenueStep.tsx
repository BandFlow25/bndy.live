// src/components/events/steps/VenueStep.tsx
import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchVenues } from '@/lib/services/venue-service';
import { BndyLogo } from '@/components/ui/bndylogo';
import { Building } from 'lucide-react';
import type { EventFormData } from '../EventCreationForm';
import { NonBand, Venue } from '@/lib/types';

interface VenueStepProps {
  map: google.maps.Map;
  form: UseFormReturn<EventFormData>;
  onNext: () => void;
}

export function VenueStep({ map, form, onNext }: VenueStepProps) {
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
              onClick={() => {
                form.setValue('venue', venue);
                onNext();
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{venue.name}</h3>
                      {venue.id ? (
                        <div className="w-6 h-6">
                          <BndyLogo />
                        </div>
                      ) : (
                        <Building className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    {venue.address && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {venue.address}
                      </p>
                    )}
                    {venue.id ? (
                      <p className="text-xs text-primary mt-1">Verified venue</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        New venue - will be added to database
                      </p>
                    )}
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