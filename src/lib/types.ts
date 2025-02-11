// src/lib/types.ts

// Main Gig interface for events
export interface Gig {
  id: string;
  bandName: string;
  venueName: string;
  date: string;
  time: string;
  location: {
    lat: number;
    lng: number;
  };
  venueAddress: string;
  ticketPrice?: string;
  ticketLink?: string;
  genre?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  type: 'gig';
}

export type GigFormInput = Omit<Gig, 'id' | 'status' | 'createdAt' | 'type'>;
   
// Venue types
export interface Venue {
  id: string;
  name: string;
  nameVariants?: string[];  // Other ways this venue has been written
  googlePlaceId?: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  postcode?: string;
  validated: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface GigFilters {
  searchTerm: string;
  genre?: string;
  ticketType: 'all' | 'free' | 'paid';
  postcode?: string;
  dateFilter: 'all' | 'today' | 'week' | 'month';
}

// Location related types
export interface LocationFilter {
  searchRadius: number;
  center?: {
    lat: number;
    lng: number;
  };
}