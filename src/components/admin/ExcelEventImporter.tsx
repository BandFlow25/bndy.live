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

export function ExcelEventImporter() {
  const [processedEvents, setProcessedEvents] = useState<ProcessedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Grouping function that divides events into 4 buckets based on matching status.
  const groupEvents = (events: ProcessedEvent[]) => {
    const groups = {
      group1: [] as ProcessedEvent[], // Verified Artist & Verified Venue (local)
      group2: [] as ProcessedEvent[], // Verified Artist & New Venue (Google Places result)
      group3: [] as ProcessedEvent[], // New Artist & New Venue (Google Places result)
      group4: [] as ProcessedEvent[], // No Venue Match (Google Places not found)
    };

    events.forEach(event => {
      if (event.venueMatch) {
        if (event.artistMatch && !event.artistMatch.isNew && !event.venueMatch.isNew) {
          groups.group1.push(event);
        } else if (event.artistMatch && !event.artistMatch.isNew && event.venueMatch.isNew) {
          groups.group2.push(event);
        } else if ((!event.artistMatch || event.artistMatch.isNew) && event.venueMatch.isNew) {
          groups.group3.push(event);
        } else {
          groups.group4.push(event);
        }
      } else {
        groups.group4.push(event);
      }
    });
    return groups;
  };

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
      // Using header: 1 returns an array for each row (no header row in your file)
      const rows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false });
      console.log("Parsed rows:", rows.slice(0, 5)); // Inspect first 5 rows

      // Process rows into events – col0 = date, col1 = artist, col2 = venue
      const events: ProcessedEvent[] = rows
        .filter((row: any[]) => row && row.length >= 3 && row[0] && row[1] && row[2])
        .map((row: any[], index: number) => {
          // Process the date (handling both Date objects and strings)
          const dateCell = row[0];
          let dateValue: Date;
          if (dateCell instanceof Date) {
            dateValue = dateCell;
          } else {
            dateValue = new Date(dateCell);
          }
          if (isNaN(dateValue.getTime())) {
            throw new Error(`Invalid date encountered in row ${index}`);
          }
          const isoDate = dateValue.toISOString().split('T')[0];

          // Extract artist (col1) and venue (col2) directly
          const artistCell = row[1];
          const venueCell = row[2];

          return {
            id: `import-${index}`,
            artist: String(artistCell).trim() || 'Unknown Artist',
            venue: String(venueCell).trim() || 'Unknown Venue',
            date: isoDate,
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
      // Set status to "processing" while we work on the event
      setProcessedEvents(prev =>
        prev.map(e =>
          e.id === event.id ? { ...e, status: 'processing' as const } : e
        )
      );

      // Lookup venue using your venue-service; this will try local matching then Google Places if needed.
      const venueResults = await searchVenues(event.venue);
      let bestVenueMatch = null;
      let bestVenueConfidence = 0;
      for (const venue of venueResults) {
        const confidence = stringSimilarity(venue.name.toLowerCase(), event.venue.toLowerCase());
        if (confidence > bestVenueConfidence && confidence > 0.7) {
          bestVenueMatch = venue;
          bestVenueConfidence = confidence;
        }
      }

      // Lookup artist using your artist-service.
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

      // If both artist and a verified (local) venue are found, run the event conflict check.
      let conflicts = { conflicts: [] };
      if (bestVenueMatch && bestVenueMatch.id && bestArtistMatch && !bestArtistMatch.isNew) {
        conflicts = await checkEventConflicts({
          venue: bestVenueMatch,
          artists: [bestArtistMatch],
          date: event.date,
          isOpenMic: false
        });
      }

      // Update the event with match details.
      setProcessedEvents(prev =>
        prev.map(e => {
          if (e.id === event.id) {
            return {
              ...e,
              status: 'ready' as const,
              artistMatch: bestArtistMatch
                ? {
                    id: bestArtistMatch.id,
                    name: bestArtistMatch.name,
                    confidence: bestArtistConfidence,
                    isNew: !bestArtistMatch.id
                  }
                : {
                    name: event.artist,
                    confidence: 0,
                    isNew: true
                  },
              venueMatch: bestVenueMatch
                ? {
                    id: bestVenueMatch.id,
                    name: bestVenueMatch.name,
                    confidence: bestVenueConfidence,
                    isNew: !bestVenueMatch.id
                  }
                : {
                    name: event.venue,
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

  // Group processed events for display.
  const groupedEvents = groupEvents(processedEvents);

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
        <div className="space-y-6">
          {(["group1", "group2", "group3", "group4"] as const).map(groupKey => {
            const group = groupedEvents[groupKey];
            return (
              <Card key={groupKey}>
                <CardHeader>
                  <CardTitle>
                    {groupKey === "group1" && "Group 1: Verified Artist & Venue (Event conflict check applied)"}
                    {groupKey === "group2" && "Group 2: Verified Artist & New Venue (Google Places match)"}
                    {groupKey === "group3" && "Group 3: New Artist & New Venue (Google Places match)"}
                    {groupKey === "group4" && "Group 4: No Venue Match (Google Places not found)"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-y-auto max-h-[50vh] space-y-4">
                    {group.length > 0 ? (
                      group.map(event => (
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
                                    Venue:{' '}
                                    {event.venueMatch.isNew ? (
                                      <>
                                        <span className="text-yellow-500">New Venue (Google Places)</span>
                                        {" - "}
                                        <span className="text-muted-foreground">(Input: {event.venue})</span>
                                      </>
                                    ) : (
                                      <span className="text-green-500">
                                        Verified Venue: {event.venueMatch.name} (100% match)
                                      </span>
                                    )}
                                  </p>
                                )}

                                {event.artistMatch && (
                                  <p>
                                    Artist:{' '}
                                    {event.artistMatch.isNew ? (
                                      <>
                                        <span className="text-yellow-500">New Artist</span>
                                        {" - "}
                                        <span className="text-muted-foreground">(Input: {event.artist})</span>
                                      </>
                                    ) : (
                                      <span className="text-green-500">
                                        Verified Artist: {event.artistMatch.name} (100% match)
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
                                  onClick={() => {
                                    // Handle create/confirm action
                                  }}
                                >
                                  Confirm
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">No events in this group.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
