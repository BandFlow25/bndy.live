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
    
    // Sort venues alphabetically by name
    const sortedVenues = venueData.sort((a, b) => 
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
    
    setVenues(sortedVenues);
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
      // Reload and resort
      loadVenues();
    } catch (error) {
      console.error('Error updating venue:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.VENUES, id));
      setDeleteConfirm(null);
      loadVenues();
    } catch (error) {
      console.error('Error deleting venue:', error);
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Place ID</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {venues.map((venue) => (
            <TableRow key={venue.id}>
              <TableCell>
                {editingId === venue.id ? (
                  <Input
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                ) : (
                  venue.name
                )}
              </TableCell>
              <TableCell>
                {editingId === venue.id ? (
                  <Input
                    value={editData.address || ''}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  />
                ) : (
                  venue.address
                )}
              </TableCell>
              <TableCell>
                {editingId === venue.id ? (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      className="w-24"
                      value={editData.location?.lat || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        location: { lat: parseFloat(e.target.value), lng: editData.location?.lng || 0 }
                      })}
                    />
                    <Input
                      type="number"
                      className="w-24"
                      value={editData.location?.lng || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        location: { lat: editData.location?.lat || 0, lng: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                ) : (
                  `${venue.location.lat}, ${venue.location.lng}`
                )}
              </TableCell>
              <TableCell>
                {editingId === venue.id ? (
                  <Input
                    value={editData.googlePlaceId || ''}
                    onChange={(e) => setEditData({ ...editData, googlePlaceId: e.target.value })}
                  />
                ) : (
                  venue.googlePlaceId
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {editingId === venue.id ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSave(venue.id)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(venue)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirm(venue.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the venue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}