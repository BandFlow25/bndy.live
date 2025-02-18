import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface LegacyArtist {
  id: string;
  name: string;
  facebookUrl?: string;
  instagramUrl?: string;
  spotifyUrl?: string;
  websiteUrl?: string;
  genres?: string[];
  createdAt: string;
  updatedAt: string;
}

export function DataMigration() {
  const [legacyArtists, setLegacyArtists] = useState<LegacyArtist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadLegacyData = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'bf_nonbands'));
        const artists = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LegacyArtist[];
        
        setLegacyArtists(artists.sort((a, b) => 
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        ));
      } catch (error) {
        setError('Error loading legacy data: ' + (error as Error).message);
      }
    };

    loadLegacyData();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedArtists(new Set(legacyArtists.map(artist => artist.id)));
    } else {
      setSelectedArtists(new Set());
    }
  };

  const handleSelectArtist = (artistId: string, checked: boolean) => {
    const newSelected = new Set(selectedArtists);
    if (checked) {
      newSelected.add(artistId);
    } else {
      newSelected.delete(artistId);
    }
    setSelectedArtists(newSelected);
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    setError(null);
    setSuccess(null);
    
    try {
      const artistsToMigrate = legacyArtists.filter(artist => 
        selectedArtists.has(artist.id)
      );

      let successCount = 0;
      const errors: string[] = [];

      for (const artist of artistsToMigrate) {
        try {
          const { id, ...artistData } = artist;
          await addDoc(collection(db, 'bf_artists'), {
            ...artistData,
            migratedFromId: id,
            migratedAt: new Date().toISOString()
          });
          successCount++;
        } catch (error) {
          errors.push(`Failed to migrate ${artist.name}: ${(error as Error).message}`);
        }
      }

      if (errors.length > 0) {
        setError(`Migration completed with errors:\n${errors.join('\n')}`);
      }
      
      setSuccess(`Successfully migrated ${successCount} artists`);
      
      // Refresh the list
      const snapshot = await getDocs(collection(db, 'bf_nonbands'));
      const remainingArtists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LegacyArtist[];
      
      setLegacyArtists(remainingArtists);
      setSelectedArtists(new Set());
      
    } catch (error) {
      setError('Migration failed: ' + (error as Error).message);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Legacy Data Migration</h2>
        <div className="space-x-4">
          <Button
            variant="outline"
            onClick={() => handleSelectAll(!selectedArtists.size)}
          >
            {selectedArtists.size ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            onClick={handleMigrate}
            disabled={isMigrating || !selectedArtists.size}
          >
            {isMigrating ? 'Migrating...' : `Migrate Selected (${selectedArtists.size})`}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-4 rounded-md mb-4">
          {success}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedArtists.size === legacyArtists.length}
                onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Genres</TableHead>
            <TableHead>Social Links</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {legacyArtists.map((artist) => (
            <TableRow key={artist.id}>
              <TableCell>
                <Checkbox
                  checked={selectedArtists.has(artist.id)}
                  onCheckedChange={(checked: boolean) => 
                    handleSelectArtist(artist.id, checked)
                  }
                />
              </TableCell>
              <TableCell>{artist.name}</TableCell>
              <TableCell>{artist.genres?.join(', ')}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  {artist.facebookUrl && <div>FB: {artist.facebookUrl}</div>}
                  {artist.instagramUrl && <div>IG: {artist.instagramUrl}</div>}
                  {artist.spotifyUrl && <div>Spotify: {artist.spotifyUrl}</div>}
                  {artist.websiteUrl && <div>Web: {artist.websiteUrl}</div>}
                </div>
              </TableCell>
              <TableCell>
                {new Date(artist.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}