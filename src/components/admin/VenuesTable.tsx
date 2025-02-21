// src/components/admin/VenuesTable.tsx
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
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

interface Venue {
  id: string;
  name: string;
  address?: string;
  location: {
    lat: number;
    lng: number;
  };
  googlePlaceId?: string;
  standardStartTime?: string;
  standardEndTime?: string;
  standardTicketPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export function VenuesTable() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Venue>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    const snapshot = await getDocs(collection(db, COLLECTIONS.VENUES));
    const venueData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Venue[];

    setVenues(venueData);
  };

  const handleEdit = (venue: Venue) => {
    setEditingId(venue.id);
    setEditData(venue);
  };

  const handleSave = async (id: string) => {
    try {
      const venueRef = doc(db, COLLECTIONS.VENUES, id);
      await updateDoc(venueRef, {
        ...editData,
        updatedAt: new Date().toISOString()
      });
      setEditingId(null);
      loadVenues();
    } catch (error) {
      console.error('Error updating venue:', error);
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Ticket Price</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {venues.map((venue) => (
            <TableRow key={venue.id}>
              <TableCell>
                {editingId === venue.id ? (
                  <Input value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                ) : (
                  venue.name
                )}
              </TableCell>
              <TableCell>
                {editingId === venue.id ? (
                  <Input value={editData.address || ''} onChange={(e) => setEditData({ ...editData, address: e.target.value })} />
                ) : (
                  venue.address
                )}
              </TableCell>
              <TableCell>
                {editingId === venue.id ? (
                  <Input type="time" value={editData.standardStartTime || ''} onChange={(e) => setEditData({ ...editData, standardStartTime: e.target.value })} />
                ) : (
                  venue.standardStartTime || "-"
                )}
              </TableCell>
              <TableCell>
                {editingId === venue.id ? (
                  <Input type="time" value={editData.standardEndTime || ''} onChange={(e) => setEditData({ ...editData, standardEndTime: e.target.value })} />
                ) : (
                  venue.standardEndTime || "-"
                )}
              </TableCell>
              <TableCell>
                {editingId === venue.id ? (
                  <Input type="number" value={editData.standardTicketPrice?.toString() || ''} onChange={(e) => setEditData({ ...editData, standardTicketPrice: parseFloat(e.target.value) || 0 })} />
                ) : (
                  venue.standardTicketPrice ? `£${venue.standardTicketPrice.toFixed(2)}` : "-"
                )}
              </TableCell>
              <TableCell>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(venue)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleSave(venue.id)}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
