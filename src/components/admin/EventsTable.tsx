// src/components/admin/EventsTable.tsx
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { formatEventDate, formatTime } from '@/lib/utils/date-utils';
import { getArtistById } from '@/lib/services/artist-service';
import { getVenueById } from '@/lib/services/venue-service';
import { Pencil, Trash2, Save, X } from 'lucide-react';
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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
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

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.EVENTS, id));
      setDeleteConfirm(null);
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Venue</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Ticket Price</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>{event.name}</TableCell>
              <TableCell>{event.artistName}</TableCell>
              <TableCell>{event.venueName}</TableCell>
              <TableCell>{formatEventDate(new Date(event.date))}</TableCell>
              <TableCell>{formatTime(event.startTime)}</TableCell>
              <TableCell>£{event.ticketPrice ? Number(event.ticketPrice).toFixed(2) : '0.00'}</TableCell><TableCell>
                <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(event.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
