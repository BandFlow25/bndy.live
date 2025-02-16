// src/lib/services/venue-service.ts
import { collection, getDocs, addDoc, where, query } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { searchVenueWithIncreasingRadius } from './places-service';
import type { Venue, NewVenue } from '@/lib/types';  // Import from central types file

export async function searchVenues(searchTerm: string, map: google.maps.Map): Promise<Venue[]> {
  if (!searchTerm || searchTerm.length < 3) return [];
  
  try {
    const venuesRef = collection(db, COLLECTIONS.VENUES);
    const snapshot = await getDocs(venuesRef);
    const existingVenues = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        const nameMatch = data.name.toLowerCase().includes(searchTerm.toLowerCase());
        const variantMatch = data.nameVariants?.some(
          (variant: string) => variant.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return nameMatch || variantMatch;
      })
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        validated: true
      })) as Venue[];

    if (existingVenues.length > 0) {
      return existingVenues;
    }

    // Only if no matches in bf_venues, search Places API
    const placesResults = await searchVenueWithIncreasingRadius(searchTerm, map);
    const now = new Date().toISOString();
    
    return placesResults.map(place => ({
      name: place.name || '',
      address: place.formatted_address || '',
      location: place.geometry?.location?.toJSON() || { lat: 0, lng: 0 },
      googlePlaceId: place.place_id,
      validated: false,
      id: '',  // Will be assigned when saved
      createdAt: now,
      updatedAt: now
    })) as Venue[];

  } catch (error) {
    console.error('Error searching venues:', error);
    return [];
  }
}

export async function createVenue(venue: NewVenue): Promise<Venue> {
  const now = new Date().toISOString();
  const venueData = {
    ...venue,
    validated: false,
    createdAt: now,
    updatedAt: now
  };
  
  const docRef = await addDoc(collection(db, COLLECTIONS.VENUES), venueData);
  return { ...venueData, id: docRef.id } as Venue;
}