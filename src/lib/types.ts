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
export interface BaseEvent {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  venueId: string;
  venueName: string;  // Denormalized for convenience
  location: {
    lat: number;
    lng: number;
  };
  ticketPrice?: string;
  ticketUrl?: string;
  eventUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface BandEvent extends BaseEvent {
  bandId: string;
  source: 'bndy.core';
}

export interface LiveEvent extends BaseEvent {
  artistIds: string[];  // Array of nonband IDs
  source: 'bndy.live';
}

export type Event = BandEvent | LiveEvent;

// Artist Types
export interface NonBand {
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
  artists: NonBand[];
  name: string;
  description: string; // Added this field
  date: string;
  startTime: string;
  endTime?: string;
  ticketPrice?: string;
  ticketUrl?: string;
  eventUrl?: string;
}
