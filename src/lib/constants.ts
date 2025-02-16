// src\lib\constants.ts
export const GENRES = [
  'Rock', 'Jazz', 'Blues', 'Alternative', 'Folk', 'Pop', 
  'Indie', 'Metal', 'Soul', 'Funk', 'Country', 'Rock n Roll', 'Punk', 'Hip Hop', 'Other'
] as const;

export const COLLECTIONS = {
  BANDS: 'bf_bands',
  EVENTS: 'bf_events',
  VENUES: 'bf_venues',
  NONBANDS: 'bf_nonbands'
} as const;