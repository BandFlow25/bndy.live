'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { getArtistById } from '@/lib/services/artist-service';
import { getVenueById } from '@/lib/services/venue-service';
import { Event } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { SearchIcon, CalendarIcon, MoreHorizontalIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { formatEventDate, formatTime } from '@/lib/utils/date-utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface EventWithDetails extends Event {
  artistName: string;
  venueName: string;
}

export default function ListView() {
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const eventsQuery = query(
          collection(db, COLLECTIONS.EVENTS),
          orderBy('date', 'asc'),
          limit(100)
        );

        const snapshot = await getDocs(eventsQuery);
        const eventData: EventWithDetails[] = [];

        const basicEvents = snapshot.docs.map(doc => {
          return { id: doc.id, ...doc.data() } as Event;
        });

        for (const event of basicEvents) {
          let artistName = 'Unknown Artist';
          let venueName = 'Unknown Venue';

          if (event.artistIds?.length) {
            try {
              const artist = await getArtistById(event.artistIds[0]);
              artistName = artist?.name || 'Unknown Artist';
            } catch (err) {}
          }

          if (event.venueId) {
            try {
              const venue = await getVenueById(event.venueId);
              venueName = venue?.name || 'Unknown Venue';
            } catch (err) {}
          }

          eventData.push({ ...event, artistName, venueName });
        }

        setEvents(eventData);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const filteredEvents = searchTerm
    ? events.filter(event =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.artistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venueName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : events;

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const dateKey = formatEventDate(new Date(event.date));
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, EventWithDetails[]>);

  const sortedDates = Object.entries(groupedEvents);
  sortedDates.slice(0, 3).forEach(([date]) => {
    expandedDates[date] = true;
  });

  return (
    <div className="container mx-auto px-4 pt-[96px] pb-20 max-w-6xl overflow-y-auto h-screen">
      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search artist, venue or event name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p>Loading events...</p>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(([date, events]) => (
            <div key={date}>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }))}>
                <h3 className="text-lg font-semibold flex items-center mb-2">
                  <CalendarIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                  {date}
                </h3>
                {expandedDates[date] ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
              </div>
              {expandedDates[date] && (
                <div>
                  <div className="grid grid-cols-[2fr_2fr_1fr_1fr_40px] gap-4 border-b border-muted-foreground py-2 text-sm font-semibold">
                    <div>Artist</div>
                    <div>Venue</div>
                    <div>Time</div>
                    <div>Price</div>
                    <div></div>
                  </div>
                  {events.sort((a, b) => a.artistName.localeCompare(b.artistName)).map((event) => (
                    <div key={event.id} className="grid grid-cols-[2fr_2fr_1fr_1fr_40px] gap-4 border-b border-muted-foreground py-2 text-sm">
                      <div>{event.artistName}</div>
                      <div>{event.venueName}</div>
                      <div>{formatTime(event.startTime)}</div>
                      <div>
                        {!event.ticketPrice || parseFloat(event.ticketPrice.toString()) === 0 ? (
                          <Badge className="bg-green-300 text-green-900">£ree</Badge>
                        ) : (
                          `£${Number(event.ticketPrice).toFixed(2)}`
                        )}
                      </div>
                      <div className="w-5 flex justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <MoreHorizontalIcon className="cursor-pointer w-5 h-5 text-muted-foreground" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              Event: {event.name}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              {event.ticketUrl ? <a href={event.ticketUrl} target="_blank">Buy Tickets</a> : 'No Ticket URL'}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              {event.description || 'No description available'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
