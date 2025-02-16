// src/lib/services/artist-service.ts
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { NonBand } from '@/lib/types';

export type NewNonBand = Omit<NonBand, 'id' | 'createdAt' | 'updatedAt'>;

export async function searchArtists(searchTerm: string): Promise<NonBand[]> {
  if (!searchTerm || searchTerm.length < 2) return [];

  try {
    const artistsRef = collection(db, COLLECTIONS.NONBANDS);
    const snapshot = await getDocs(artistsRef);
    const existingArtists = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        const name = data.name as string;
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as NonBand[];

    return existingArtists;
  } catch (error) {
    console.error('Error searching artists:', error);
    return [];
  }
}

export async function createArtist(artist: NewNonBand): Promise<NonBand> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTIONS.NONBANDS), {
    ...artist,
    nameVariants: [artist.name],
    createdAt: now,
    updatedAt: now
  });

  return {
    id: docRef.id,
    ...artist,
    nameVariants: [artist.name],
    createdAt: now,
    updatedAt: now
  };
}