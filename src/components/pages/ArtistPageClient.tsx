// src/components/pages/ArtistPageClient.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Music, Calendar, ChevronLeft, ExternalLink, Facebook } from 'lucide-react';
import { Event, Artist, Venue } from '@/lib/types';
import { getArtistById } from '@/lib/services/artist-service';
import { getVenueById } from '@/lib/services/venue-service';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { formatEventDate, formatTime } from '@/lib/utils/date-utils';
import { FacebookImage } from '../ui/facebook-image';

interface ArtistPageClientProps {
  id: string;
}

interface EventWithDetails extends Event {
  venueDetails?: Venue | null;  // Change this to allow null
}

export function ArtistPageClient({ id }: ArtistPageClientProps) {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArtistAndEvents() {
      try {
        const artistData = await getArtistById(id);
        setArtist(artistData);

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const eventsRef = collection(db, COLLECTIONS.EVENTS);
        const q = query(
          eventsRef,
          where('artistIds', 'array-contains', id),
          where('date', '>=', now.toISOString()),
          orderBy('date', 'asc')
        );

        const snapshot = await getDocs(q);
        const artistEvents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];

        // Fetch venue details for each event
        const eventsWithDetails = await Promise.all(
          artistEvents.map(async (event) => {
            const venueDetails = await getVenueById(event.venueId);
            return {
              ...event,
              venueDetails
            };
          })
        );

        setEvents(eventsWithDetails);
      } catch (error) {
        console.error('Error loading artist data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadArtistAndEvents();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!artist) {
    return <div className="flex items-center justify-center min-h-screen">Artist not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">

      {/* Artist Header */}
      <div className="bg-card rounded-lg p-6 mb-8 border border-primary/20 flex items-center gap-6">
        {artist?.facebookUrl && (
          <FacebookImage
            facebookUrl={artist.facebookUrl}
            alt={`${artist.name} Profile`}
            size="large"
            className="border border-primary"
          />
        )}

        <div>
          <h1 className="text-2xl font-bold mb-4">{artist?.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {artist?.genres && artist.genres.length > 0 && (
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-primary" />
                <span>{artist.genres.join(', ')}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              {artist?.websiteUrl && (
                <a href={artist.websiteUrl} target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 inline-flex items-center gap-1">
                  Website <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {artist?.facebookUrl && (
                <a href={artist.facebookUrl} target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 inline-flex items-center gap-1">
                  Facebook <Facebook className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Upcoming Events</h2>
        
        {events.length > 0 && (
          <>
            {/* Next Gig Card */}
            <div className="bg-card rounded-lg p-4 border border-primary/20 mb-8">
              <h3 className="font-semibold text-lg mb-2">Next Event</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>
                    {formatEventDate(new Date(events[0].date))} @ {formatTime(events[0].startTime)}
                    {events[0].endTime && ` - ${formatTime(events[0].endTime)}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>at</span>
                  <Link href={`/venue/${events[0].venueId}`} className="hover:text-primary">
                    {events[0].venueDetails?.name || 'Unknown Venue'}
                  </Link>
                </div>
                {events[0].ticketPrice && (
                  <div className="font-medium text-primary">
                    {events[0].ticketPrice === 'FREE' ? 'Free Entry' : `£${events[0].ticketPrice}`}
                  </div>
                )}
                {events[0].eventUrl && (
                  <a href={events[0].eventUrl} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-primary hover:underline inline-flex items-center gap-1">
                    Event Details <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Other Events Table */}
            {events.length > 1 && (
              <div className="overflow-hidden rounded-lg border border-primary/20">
                <table className="w-full">
                  <thead className="bg-primary/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Venue</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Tickets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/20">
                    {events.slice(1).map(event => (
                      <tr key={event.id} className="hover:bg-primary/5">
                        <td className="px-4 py-3 text-sm">
                          {formatEventDate(new Date(event.date))} @ {formatTime(event.startTime)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Link href={`/venue/${event.venueId}`} className="hover:text-primary">
                            {event.venueDetails?.name || 'Unknown Venue'}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {event.ticketPrice ? `£${event.ticketPrice}` : 'Free'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {events.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No upcoming events scheduled
          </div>
        )}
      </div>
    </div>
  );
}