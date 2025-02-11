// src/lib/services/venue-service.ts
import { findVenueByName, addVenue, updateVenue } from '@/lib/services/firestore';
import { Venue } from '@/lib/types';

// Normalize venue name
export function normalizeVenueName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Remove trailing commas and spaces
    .replace(/[,\s]+$/, '')
    // Standardize "The" prefix
    .replace(/^the\s+/, '')
    // Remove common suffixes
    .replace(/\s+(pub|bar|club|inn)$/i, '');
}

// Process a venue through Google Places and save to Firestore
export async function processVenue(venueName: string, area: string = 'Stoke-on-Trent') {
  try {
    const normalizedName = normalizeVenueName(venueName);
    console.log(`Processing venue: ${venueName} (normalized: ${normalizedName})`);

    // Check if venue already exists
    const existingVenues = await findVenueByName(normalizedName);
    if (!existingVenues.empty) {
      const existingVenue = existingVenues.docs[0];
      console.log(`Found existing venue: ${existingVenue.id}`);
      
      // Update name variants if this one isn't included
      const venueData = existingVenue.data() as Venue;
      if (!venueData.nameVariants?.includes(venueName)) {
        await updateVenue(existingVenue.id, {
          nameVariants: [...(venueData.nameVariants || []), venueName]
        });
      }
      
      return existingVenue.id;
    }

    // TODO: Call Google Places API to validate and get details
    // For now, create unvalidated venue
    const venueData: Omit<Venue, 'id'> = {
      name: normalizedName,
      nameVariants: [venueName],
      location: {
        lat: 53.002668, // Default to Stoke center for now
        lng: -2.179404
      },
      address: `${venueName}, ${area}`,
      validated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newVenue = await addVenue(venueData);
    console.log(`Created new venue: ${newVenue.id}`);
    return newVenue.id;

  } catch (error) {
    console.error('Error processing venue:', error);
    throw error;
  }
}

// Process a batch of venues
export async function processVenues(venueNames: string[]) {
  const results = [];
  const errors = [];

  for (const name of venueNames) {
    try {
      const venueId = await processVenue(name);
      results.push({ name, venueId, success: true });
    } catch (error) {
      errors.push({ name, error });
      results.push({ name, success: false, error });
    }
  }

  return {
    results,
    errors,
    summary: {
      total: venueNames.length,
      successful: results.filter(r => r.success).length,
      failed: errors.length
    }
  };
}