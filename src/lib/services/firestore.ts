import { db } from '@/lib/config/firebase';
import { collection, addDoc, getDocs, query, where, getDoc, doc, updateDoc } from 'firebase/firestore';
import { GigFormInput, Venue } from '@/lib/types';
import { COLLECTIONS } from '@/lib/constants';

// Existing gig operations
export const addGig = async (data: GigFormInput) => {
  return addDoc(collection(db, COLLECTIONS.EVENTS), {
    ...data,
    type: 'gig',
    status: 'pending',
    createdAt: new Date().toISOString()
  });
};

export const getGigs = async () => {
  const q = query(
    collection(db, COLLECTIONS.EVENTS),
    where('type', '==', 'gig')
  );
  return getDocs(q);
};

// New venue operations
export const addVenue = async (data: Omit<Venue, 'id'>) => {
  return addDoc(collection(db, COLLECTIONS.VENUES), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
};

export const updateVenue = async (id: string, data: Partial<Venue>) => {
  const venueRef = doc(db, COLLECTIONS.VENUES, id);
  return updateDoc(venueRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
};

export const getVenue = async (id: string) => {
  return getDoc(doc(db, COLLECTIONS.VENUES, id));
};

export const getVenues = async (validated?: boolean) => {
  let q = query(collection(db, COLLECTIONS.VENUES)); // Ensure it's a query

  if (typeof validated !== 'undefined') {
    q = query(q, where('validated', '==', validated)); // Append conditions
  }

  return getDocs(q);
};


export const findVenueByName = async (name: string) => {
  const q = query(
    collection(db, COLLECTIONS.VENUES),
    where('nameVariants', 'array-contains', name)
  );
  return getDocs(q);
};