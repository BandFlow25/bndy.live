// src/components/pages/VenuePageClient.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Calendar, ChevronLeft, ExternalLink } from 'lucide-react';
import { Event, Venue, Artist } from '@/lib/types';
import { getVenueById } from '@/lib/services/venue-service';
import { getArtistById } from '@/lib/services/artist-service';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { formatEventDate, formatTime } from '@/lib/utils/date-utils';

interface VenuePageClientProps {
  id: string;
}

interface EventWithDetails extends Event {
  artistDetails?: Artist | null;
}

export function VenuePageClient({ id }: VenuePageClientProps) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVenueAndEvents() {
      try {
        const venueData = await getVenueById(id);
        setVenue(venueData);

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const eventsRef = collection(db, COLLECTIONS.EVENTS);
        const q = query(
          eventsRef,
          where('venueId', '==', id),
          where('date', '>=', now.toISOString()),
          orderBy('date', 'asc')
        );

        const snapshot = await getDocs(q);
        const venueEvents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];

        // Fetch artist details for each event
        const eventsWithDetails = await Promise.all(
          venueEvents.map(async (event) => {
            const artistDetails = event.artistIds?.length > 0 ?
              await getArtistById(event.artistIds[0]) :
              null;
            return {
              ...event,
              artistDetails: artistDetails || undefined
            };
          })
        );

        setEvents(eventsWithDetails);
      } catch (error) {
        console.error('Error loading venue data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadVenueAndEvents();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!venue) {
    return <div className="flex items-center justify-center min-h-screen">Venue not found</div>;
  }

  return (
    <div className="container mx-auto px-4 pt-[96px] max-w-4xl">

      {/* Venue Header */}
      <div className="bg-card rounded-lg p-6 mb-8 border border-primary/20">
        <h1 className="text-2xl font-bold mb-4">{venue.name}</h1>
        <div className="flex items-start gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{venue.address}</span>
          </div>

          <a href={`https://www.google.com/maps/search/?api=1&query=${venue.location.lat},${venue.location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 inline-flex items-center gap-1"
          >
            View on Maps
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Upcoming Events</h2>

        {events.length > 0 && (
          <>
            {/* Next Event Card */}
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
                  <span>with</span>
                  <Link href={`/artist/${events[0].artistIds[0]}`} className="hover:text-primary">
                    {events[0].artistDetails?.name || 'Unknown Artist'}
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
                      <th className="px-4 py-3 text-left text-sm font-medium">Event</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Artist</th>
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
                          {event.name}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Link href={`/artist/${event.artistIds[0]}`} className="hover:text-primary">
                            {event.artistDetails?.name || 'Unknown Artist'}
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