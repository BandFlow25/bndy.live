// src/lib/types.ts

// Venue Types - These look good as they are distinct use cases
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
  standardStartTime?: string;
  standardEndTime?: string;
  standardTicketPrice?: string;
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

// Event Types - Let's consolidate these
export type EventSource = 'bndy.live' | 'user' | 'bndy.core';
export type EventStatus = 'pending' | 'approved' | 'rejected';

// This is our main Event type for database events
export interface Event {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  venueId: string;
  venueName: string;
  artistIds: string[];
  location: {
      lat: number;
      lng: number;
  };
  description?: string;
  ticketPrice?: string;
  ticketUrl?: string;
  eventUrl?: string;
  source: EventSource;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  claimedByBandId?: string;
  claimedAt?: string;
  isOpenMic?: boolean;
}

// Recurring Event Types
export type RecurringFrequency = 'weekly' | 'monthly';
export interface RecurringEventConfig {
    frequency: RecurringFrequency;
    endDate: string;
    // Optional settings if we need them later
    skipDates?: string[];
}

// This is what we collect in the form
export interface EventFormData {
  venue: Venue;
  artists: Artist[];
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  description?: string;
  ticketPrice?: string;
  ticketUrl?: string;
  eventUrl?: string;
  isOpenMic?: boolean;
  dateConflicts?: DateConflict[];  // Just for UI state
  recurring?: RecurringEventConfig;
}

// Conflict handling
export interface DateConflict {
  type: 'venue' | 'artist';
  name: string;
  existingEvent: {
      name: string;
      startTime: string;
  };
}

export interface EventConflictCheck {
  venue: Venue;
  artists: Artist[];
  date: string;
  isOpenMic?: boolean;
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

// These can be useful for API responses but aren't core event types
export interface VenueDetails extends Venue {
  events?: Event[];
}

export interface ArtistDetails extends Artist {
  events?: Event[];
}