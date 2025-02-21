// src/components/admin/ExcelEventImporter.tsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, AlertCircle, X } from 'lucide-react';
import { searchVenues } from '@/lib/services/venue-service';
import { searchArtists } from '@/lib/services/artist-service';
import { checkEventConflicts } from '@/lib/services/event-service';
import { stringSimilarity } from '@/lib/utils/string-utils';
import { useToast } from "@/components/ui/use-toast";
import type { ProcessedEvent } from '@/lib/types';

interface ExcelEventImporterProps {
    map: google.maps.Map;
  }

  export function ExcelEventImporter({ map }: ExcelEventImporterProps) {
    const [processedEvents, setProcessedEvents] = useState<ProcessedEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        cellDates: true,
        cellNF: true,
        cellText: true
      });

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { raw: false });

      // Process rows into events
      const events: ProcessedEvent[] = rows
        .filter((row: any) => {
          // Look for date and either artist or event name
          const hasDate = Object.values(row).some(val => 
            val && typeof val === 'string' && /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(val));
          const hasArtistOrEvent = Object.values(row).some(val =>
            val && typeof val === 'string' && val.length > 2 && !/^\d/.test(val));
          return hasDate && hasArtistOrEvent;
        })
        .map((row: any, index: number) => {
          // Try to intelligently extract fields
          const dateField = Object.entries(row).find(([_, val]) => 
            val && typeof val === 'string' && /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(val))?.[1];
          const artistField = Object.entries(row).find(([_, val]) =>
            val && typeof val === 'string' && val.length > 2 && !/^\d/.test(val))?.[1];
          const venueField = Object.entries(row).find(([key, val]) =>
            key.toLowerCase().includes('venue') || 
            (val && typeof val === 'string' && val.toLowerCase().includes('pub')))?.[1];

          return {
            id: `import-${index}`,
            artist: String(artistField || 'Unknown Artist'),
            venue: String(venueField || 'Unknown Venue'),
            date: new Date(String(dateField)).toISOString().split('T')[0],
            status: 'pending' as const
          };
        });

      setProcessedEvents(events);
      toast({
        title: "File Uploaded",
        description: `Found ${events.length} potential events to process.`
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Could not process the Excel file.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processEvent = async (event: ProcessedEvent) => {
    try {
      setProcessedEvents(prev => 
        prev.map(e => 
          e.id === event.id ? { ...e, status: 'processing' as const } : e
        )
      );

      // Search for venue matches - now passing map
      const venueResults = await searchVenues(event.venue, map);
      let bestVenueMatch = null;
      let bestVenueConfidence = 0;

      for (const venue of venueResults) {
        const confidence = stringSimilarity(venue.name.toLowerCase(), event.venue.toLowerCase());
        if (confidence > bestVenueConfidence && confidence > 0.7) {
          bestVenueMatch = venue;
          bestVenueConfidence = confidence;
        }
      }

      // Search for artist matches
      const artistResults = await searchArtists(event.artist);
      let bestArtistMatch = null;
      let bestArtistConfidence = 0;

      for (const artist of artistResults) {
        const confidence = stringSimilarity(artist.name.toLowerCase(), event.artist.toLowerCase());
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
      setProcessedEvents(prev => 
        prev.map(e => {
          if (e.id === event.id) {
            return {
              ...e,
              status: 'ready' as const,
              venueMatch: bestVenueMatch ? {
                id: bestVenueMatch.id,
                name: bestVenueMatch.name,
                confidence: bestVenueConfidence
              } : {
                name: event.venue,
                confidence: 0,
                isNew: true
              },
              artistMatch: bestArtistMatch ? {
                id: bestArtistMatch.id,
                name: bestArtistMatch.name,
                confidence: bestArtistConfidence
              } : {
                name: event.artist,
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
      setProcessedEvents(prev => 
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
    for (const event of processedEvents) {
      if (event.status === 'pending') {
        await processEvent(event);
      }
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload Excel File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={loading}
              className="max-w-sm"
            />
            {processedEvents.length > 0 && (
              <Button
                onClick={processAll}
                disabled={loading || !processedEvents.some(e => e.status === 'pending')}
              >
                Process All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {processedEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Found Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processedEvents.map((event) => (
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
                        <h3 className="text-lg font-semibold">{event.artist}</h3>
                      </div>

                      <div className="ml-7 space-y-1 text-sm">
                        <p className="text-muted-foreground">
                          at {event.venue} on {new Date(event.date).toLocaleDateString()}
                        </p>

                        {event.venueMatch && (
                          <p>
                            Venue: {event.venueMatch.isNew ? (
                              <span className="text-yellow-500">Will create new venue</span>
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
                              <span className="text-yellow-500">Will create new artist</span>
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