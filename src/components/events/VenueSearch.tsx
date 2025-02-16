// src/components/events/VenueSearch.tsx
import { useState, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { searchVenueWithIncreasingRadius } from '@/lib/services/places-service';
import { BndyLogo } from '@/components/ui/bndylogo';
import { Building } from 'lucide-react';

interface Venue {
  id?: string;
  name: string;
  address?: string;
  location: google.maps.LatLngLiteral;
  googlePlaceId?: string;
  isVerified?: boolean;
}

interface VenueSearchProps {
  map: google.maps.Map;
  onVenueSelect: (venue: Venue) => void;
}

export function VenueSearch({ map, onVenueSelect }: VenueSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);

  const searchVenues = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setVenues([]);
      return;
    }

    setLoading(true);
    try {
      // First search bf_venues
      const venuesRef = collection(db, COLLECTIONS.VENUES);
      const snapshot = await getDocs(venuesRef);
      const verifiedVenues = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          isVerified: true
        } as Venue))
        .filter(venue => {
          const searchRegex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          return (
            searchRegex.test(venue.name) ||
            (venue.address && searchRegex.test(venue.address))
          );
        });

      // Then search Google Places
      const placesResults = await searchVenueWithIncreasingRadius(term, map, 5); // Get up to 5 results
      
      if (placesResults && placesResults.length > 0) {
        const newVenues = placesResults.map(place => ({
          name: place.name || '',
          address: place.formatted_address,
          location: place.geometry?.location?.toJSON() || { lat: 0, lng: 0 },
          googlePlaceId: place.place_id,
          isVerified: false
        }));

        // Filter out any Google Places results that match verified venues
        const filteredNewVenues = newVenues.filter(newVenue => 
          !verifiedVenues.some(verified => 
            verified.googlePlaceId === newVenue.googlePlaceId ||
            (verified.name.toLowerCase() === newVenue.name.toLowerCase() &&
             verified.location.lat === newVenue.location.lat &&
             verified.location.lng === newVenue.location.lng)
          )
        );

        // Combine and sort results, prioritizing verified venues
        setVenues([...verifiedVenues, ...filteredNewVenues]);
      } else {
        setVenues(verifiedVenues);
      }
    } catch (error) {
      console.error('Error searching venues:', error);
    } finally {
      setLoading(false);
    }
  }, [map]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search for venue... (e.g., 'The Swan Stone' or 'Underground Hanley')"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          searchVenues(e.target.value);
        }}
        className="form-input"
      />

      <ScrollArea className="h-[400px]">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Searching venues...
          </div>
        ) : venues.length > 0 ? (
          venues.map((venue, index) => (
            <Card
              key={venue.id || `new-${index}`}
              className="mb-2 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onVenueSelect(venue)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{venue.name}</h3>
                      {venue.isVerified ? (
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
                    {venue.isVerified ? (
                      <p className="text-xs text-primary mt-1">Verified venue</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">New venue - will be added to database</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : searchTerm.length > 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No venues found. Try different search terms.
          </div>
        ) : null}
      </ScrollArea>
    </div>
  );
}