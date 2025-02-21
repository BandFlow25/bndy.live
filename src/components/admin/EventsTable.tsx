// src/components/admin/EventsTable.tsx
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { formatEventDate, formatTime } from '@/lib/utils/date-utils';
import { getArtistById } from '@/lib/services/artist-service';
import { getVenueById } from '@/lib/services/venue-service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Event } from '@/lib/types';

interface EventWithDetails extends Event {
  artistName: string;
  venueName: string;
}

export function EventsTable() {
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const snapshot = await getDocs(collection(db, COLLECTIONS.EVENTS));
    const eventData = await Promise.all(snapshot.docs.map(async doc => {
      const event = { id: doc.id, ...doc.data() } as Event;
      const artist = await getArtistById(event.artistIds[0]);
      const venue = await getVenueById(event.venueId);
      
      return {
        ...event,
        artistName: artist ? artist.name : 'Unknown Artist',
        venueName: venue ? venue.name : 'Unknown Venue',
      };
    }));
    
    setEvents(eventData);
  };

  const handleSelect = (id: string) => {
    setSelectedEvents(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  };

  const handleBatchDelete = async () => {
    try {
      await Promise.all([...selectedEvents].map(id => deleteDoc(doc(db, COLLECTIONS.EVENTS, id))));
      setSelectedEvents(new Set());
      setConfirmDelete(false);
      loadEvents();
    } catch (error) {
      console.error('Error deleting events:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Events</h2>
        <Button
          variant="destructive"
          disabled={selectedEvents.size === 0}
          onClick={() => setConfirmDelete(true)}
        >
          Delete Selected ({selectedEvents.size})
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={selectedEvents.size === events.length && events.length > 0}
                onCheckedChange={() => {
                  if (selectedEvents.size === events.length) {
                    setSelectedEvents(new Set());
                  } else {
                    setSelectedEvents(new Set(events.map(e => e.id)));
                  }
                }}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Venue</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Ticket Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
  {events.map((event, index) => (
    <TableRow key={event.id || `event-${index}`}>
              <TableCell>
                <Checkbox
                  checked={selectedEvents.has(event.id)}
                  onCheckedChange={() => handleSelect(event.id)}
                />
              </TableCell>
              <TableCell>{event.name}</TableCell>
              <TableCell>{event.artistName}</TableCell>
              <TableCell>{event.venueName}</TableCell>
              <TableCell>{formatEventDate(new Date(event.date))}</TableCell>
              <TableCell>{formatTime(event.startTime)}</TableCell>
              <TableCell>£{event.ticketPrice ? Number(event.ticketPrice).toFixed(2) : '0.00'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={confirmDelete} onOpenChange={() => setConfirmDelete(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedEvents.size} event(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
