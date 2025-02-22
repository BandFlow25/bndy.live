// src/components/admin/WebScraperImporter.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, AlertCircle, X } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { searchVenues } from '@/lib/services/venue-service';
import { searchArtists } from '@/lib/services/artist-service';
import { checkEventConflicts } from '@/lib/services/event-service';
import { stringSimilarity } from '@/lib/utils/string-utils';
import type { Artist, Venue } from '@/lib/types';


interface ScrapedEvent {
  id: string;
  artist: {
    name: string;
    facebookUrl?: string;
    instagramUrl?: string;
    websiteUrl?: string;
  };
  venue: {
    name: string;
    facebookUrl?: string;
    websiteUrl?: string;
    address?: string;
  };
  date: string;
  time?: string;
  ticketUrl?: string;
  ticketPrice?: string;
  description?: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  venueMatch?: {
    id?: string;
    name: string;
    confidence: number;
    isNew?: boolean;
    data?: Venue;
  };
  artistMatch?: {
    id?: string;
    name: string;
    confidence: number;
    isNew?: boolean;
    data?: Artist;
  };
  conflicts?: Array<{
    type: 'venue' | 'artist' | 'exact_duplicate';
    name: string;
    existingEvent: {
      name: string;
      startTime: string;
    };
  }>;
  error?: string;
}


  // Initialize hidden map for Google Places API
  export function WebScraperImporter() {
  const [url, setUrl] = useState('https://www.gigs-news.uk/');
  const [events, setEvents] = useState<ScrapedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Remove the map state and useEffect since we're getting map as a prop now
  
  const scrapeEvents = async () => {
   
    setLoading(true);
    try {
      const response = await fetch('/api/scrape-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.ok) throw new Error('Failed to fetch events');

      const scrapedEvents = await response.json();
      const processedEvents: ScrapedEvent[] = scrapedEvents.map((event: any, index: number) => ({
        id: `scrape-${index}`,
        ...event,
        status: 'pending' as const
      }));

      setEvents(processedEvents);

      toast({
        title: "Events Found",
        description: `Successfully found ${processedEvents.length} events.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch events from the website.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processEvent = async (event: ScrapedEvent) => {
   

    try {
      // Update status to processing
      setEvents(prev => 
        prev.map(e => 
          e.id === event.id ? { ...e, status: 'processing' as const } : e
        )
      );

      // Search for venue matches using both name and Facebook URL
      const venueResults = await searchVenues(event.venue.name);
      let bestVenueMatch: Venue | null = null;
      let bestVenueConfidence = 0;

      for (const venue of venueResults) {
        let confidence = stringSimilarity(venue.name.toLowerCase(), event.venue.name.toLowerCase());
        
        // If venue has matching website or social media, boost confidence
        if (venue.websiteUrl && venue.websiteUrl === event.venue.websiteUrl) {
          confidence = 1; // Perfect match if website URLs match
        }

        if (confidence > bestVenueConfidence && confidence > 0.7) {
          bestVenueMatch = venue;
          bestVenueConfidence = confidence;
        }
      }

      // Search for artist matches using both name and social media
      const artistResults = await searchArtists(event.artist.name);
      let bestArtistMatch: Artist | null = null;
      let bestArtistConfidence = 0;

      for (const artist of artistResults) {
        let confidence = stringSimilarity(artist.name.toLowerCase(), event.artist.name.toLowerCase());
        
        // If artist has matching social media, boost confidence
        if ((artist.websiteUrl && artist.websiteUrl === event.artist.websiteUrl) ||
            (artist.facebookUrl && artist.facebookUrl === event.artist.facebookUrl) ||
            (artist.instagramUrl && artist.instagramUrl === event.artist.instagramUrl)) {
          confidence = 1; // Perfect match if any social media URLs match
        }

        if (confidence > bestArtistConfidence && confidence > 0.7) {
          bestArtistMatch = artist;
          bestArtistConfidence = confidence;
        }
      }

      // Check for conflicts
      const conflicts = bestVenueMatch ? await checkEventConflicts({
        venue: bestVenueMatch,
        artists: bestArtistMatch ? [bestArtistMatch] : [],
        date: event.date,
        isOpenMic: false
      }) : { conflicts: [] };

      // Update event with matches and status
      setEvents(prev => 
        prev.map(e => {
          if (e.id === event.id) {
            return {
              ...e,
              status: 'ready' as const,
              venueMatch: bestVenueMatch ? {
                id: bestVenueMatch.id,
                name: bestVenueMatch.name,
                confidence: bestVenueConfidence,
                data: bestVenueMatch
              } : {
                name: event.venue.name,
                confidence: 0,
                isNew: true
              },
              artistMatch: bestArtistMatch ? {
                id: bestArtistMatch.id,
                name: bestArtistMatch.name,
                confidence: bestArtistConfidence,
                data: bestArtistMatch
              } : {
                name: event.artist.name,
                confidence: 0,
                isNew: true
              },
              conflicts: conflicts.conflicts
            };
          }
          return e;
        })
      );

    } catch (error) {
      setEvents(prev => 
        prev.map(e => 
          e.id === event.id ? { 
            ...e, 
            status: 'error' as const,
            error: error instanceof Error ? error.message : 'Unknown error'
          } : e
        )
      );
    }
  };

  const processAll = async () => {
    try {
      for (const event of events) {
        if (event.status === 'pending') {
          await processEvent(event);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Some events could not be processed.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Import from Website</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL"
              className="flex-1"
            />
            <Button
              onClick={scrapeEvents}
              disabled={loading}
            >
              {loading ? 'Fetching...' : 'Fetch Events'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {events.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Found Events</CardTitle>
              <Button
                onClick={processAll}
                disabled={loading || !events.some(e => e.status === 'pending')}
              >
                Process All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {event.status === 'pending' && (
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        )}
                        {event.status === 'processing' && (
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        )}
                        {event.status === 'ready' && (
                          <Check className="w-5 h-5 text-green-500" />
                        )}
                        {event.status === 'error' && (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                        <h3 className="text-lg font-semibold">{event.artist.name}</h3>
                      </div>

                      <div className="ml-7 space-y-1 text-sm">
                        <p className="text-muted-foreground">
                          at {event.venue.name} on {new Date(event.date).toLocaleDateString()}
                          {event.time && ` at ${event.time}`}
                        </p>

                        {event.venueMatch && (
                          <p>
                            Venue: {event.venueMatch.isNew ? (
                              <span className="text-yellow-500">
                                Will create new venue with social links
                              </span>
                            ) : (
                              <span className="text-green-500">
                                Matched {event.venueMatch.name} ({Math.round(event.venueMatch.confidence * 100)}% confidence)
                              </span>
                            )}
                          </p>
                        )}

                        {event.artistMatch && (
                          <p>
                            Artist: {event.artistMatch.isNew ? (
                              <span className="text-yellow-500">
                                Will create new artist with social links
                              </span>
                            ) : (
                              <span className="text-green-500">
                                Matched {event.artistMatch.name} ({Math.round(event.artistMatch.confidence * 100)}% confidence)
                              </span>
                            )}
                          </p>
                        )}

                        {event.conflicts && event.conflicts.length > 0 && (
                          <p className="text-red-500">
                            ⚠️ {event.conflicts.length} potential conflicts found
                          </p>
                        )}

                        {event.error && (
                          <p className="text-red-500">{event.error}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {event.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => processEvent(event)}
                          disabled={loading}
                        >
                          Process
                        </Button>
                      )}
                      {event.status === 'ready' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {/* Handle create/confirm */}}
                        >
                          Confirm
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}