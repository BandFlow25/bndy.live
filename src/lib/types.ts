// src/lib/types.ts

// Venue Types
export interface BaseVenue {
  name: string;
  nameVariants?: string[];
  googlePlaceId?: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  postcode?: string;
}

export interface Venue extends BaseVenue {
  id: string;
  validated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewVenue extends BaseVenue {
  id?: string;  // Optional during creation
}

// Event Types
export type EventSource = 'bndy.live' | 'user' | 'bndy.core';

export interface Event {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  venueId: string;
  venueName: string;
  artistIds: string[];  // Array of artist IDs
  location: {
    lat: number;
    lng: number;
  };
  description?: string;
  ticketPrice?: string;
  ticketUrl?: string;
  eventUrl?: string;
  source: EventSource;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  createdById?: string;    // Optional: ID of the user who created it
  claimedByBandId?: string; // Optional: ID of the band that claimed this event
  claimedAt?: string;      // Optional: When it was claimed
}


// Artist Types
export interface Artist {
  id: string;
  name: string;
  nameVariants?: string[];
  facebookUrl?: string;
  instagramUrl?: string;
  spotifyUrl?: string;
  websiteUrl?: string;
  genres?: string[];
  createdAt: string;
  updatedAt: string;
}

// Filter Types
export interface EventFilters {
  searchTerm: string;
  genre?: string;
  ticketType: 'all' | 'free' | 'paid';
  postcode?: string;
  dateFilter: 'all' | 'today' | 'week' | 'month';
}

export interface LocationFilter {
  searchRadius: number;
  center?: {
    lat: number;
    lng: number;
  };
}

// Form Data Types
export interface EventFormData {
  venue: Venue;
  artists: Artist[];
  name: string;
  description: string; // Added this field
  date: string;
  startTime: string;
  endTime?: string;
  ticketPrice?: string;
  ticketUrl?: string;
  eventUrl?: string;
}

export interface VenueDetails extends Venue {
  events?: Event[];
}

export interface ArtistDetails extends Artist {
  events?: Event[];
}
