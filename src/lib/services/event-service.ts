// src/lib/services/event-service.ts
import { collection, addDoc, where, query, doc, getDocs} from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { createArtist } from './artist-service';
import { createVenue } from './venue-service';
import type { NonBand, EventFormData } from '@/lib/types';

interface EventData {
  venueId: string | undefined;
  artistIds: string[];
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: google.maps.LatLngLiteral;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  ticketPrice?: string;
  ticketUrl?: string;
  eventUrl?: string;
}

export async function createEvent(data: EventFormData) {
  // Ensure venue exists in database
  let venueId = data.venue.id;
  if (!venueId) {
    const newVenue = await createVenue(data.venue);
    venueId = newVenue.id;
  }

  // Ensure all artists exist in database
  const artistIds = await Promise.all(
    data.artists.map(async artist => {
      if (artist.id) return artist.id;
      const newArtist = await createArtist(artist);
      return newArtist.id;
    })
  );

  // Create event data with optional fields
  const eventData: EventData = {
    venueId,
    artistIds,
    name: data.name || `${data.artists[0].name} @ ${data.venue.name}`,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    location: data.venue.location,
    status: 'pending',
    source: 'bndy.live',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Add optional fields if they have values
  if (data.ticketPrice && data.ticketPrice.trim() !== '') {
    eventData.ticketPrice = data.ticketPrice;
  }
  if (data.ticketUrl && data.ticketUrl.trim() !== '') {
    eventData.ticketUrl = data.ticketUrl;
  }
  if (data.eventUrl && data.eventUrl.trim() !== '') {
    eventData.eventUrl = data.eventUrl;
  }

  return addDoc(collection(db, COLLECTIONS.EVENTS), eventData);
}

interface ConflictCheck {
  venue: {
    id?: string;
    name: string;
  };
  artists: NonBand[];
  date: string;
  startTime: string;
}

interface Conflict {
  type: 'venue' | 'artist';
  name: string;
  existingEvent: {
    name: string;
    startTime: string;
  };
}

export async function checkEventConflicts({
  venue,
  artists,
  date,
  startTime
}: ConflictCheck): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];

  // Convert time strings to comparable numbers (e.g., "20:30" -> 2030)
  const timeToNumber = (time: string) => parseInt(time.replace(':', ''));
  const eventTime = timeToNumber(startTime);

  // Check venue conflicts
  if (venue.id) {
    const venueQuery = query(
      collection(db, COLLECTIONS.EVENTS),
      where('venueId', '==', venue.id),
      where('date', '==', date)
    );

    const venueEvents = await getDocs(venueQuery);
    venueEvents.forEach(doc => {
      const event = doc.data();
      const existingTime = timeToNumber(event.startTime);
      
      // Check if events are within 4 hours of each other
      if (Math.abs(existingTime - eventTime) <= 400) {
        conflicts.push({
          type: 'venue',
          name: venue.name,
          existingEvent: {
            name: event.name,
            startTime: event.startTime
          }
        });
      }
    });
  }

  // Check artist conflicts
  for (const artist of artists) {
    if (artist.id) {
      const artistQuery = query(
        collection(db, COLLECTIONS.EVENTS),
        where('artistIds', 'array-contains', artist.id),
        where('date', '==', date)
      );

      const artistEvents = await getDocs(artistQuery);
      artistEvents.forEach(doc => {
        const event = doc.data();
        const existingTime = timeToNumber(event.startTime);
        
        // Check if events are within 4 hours of each other
        if (Math.abs(existingTime - eventTime) <= 400) {
          conflicts.push({
            type: 'artist',
            name: artist.name,
            existingEvent: {
              name: event.name,
              startTime: event.startTime
            }
          });
        }
      });
    }
  }

  return conflicts;
}