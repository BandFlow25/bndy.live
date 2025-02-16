//src\app\page.tsx
'use client'
import { useState, useEffect } from "react";
import { Event } from "@/lib/types";
import { MapView } from "@/components/MapView";
import { Sidebar } from "@/components/Sidebar";
import { AddEventButton } from '@/components/events/AddEventButton';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Settings } from 'lucide-react'; // Using settings icon for admin

interface EventFilters {
  searchTerm: string;
  ticketType: 'all' | 'free' | 'paid';
  dateFilter: 'all' | 'today' | 'week' | 'month';
  postcode?: string;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [filters, setFilters] = useState<EventFilters>({
    searchTerm: "",
    ticketType: "all",
    dateFilter: "all"
  });
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);

  // Load events from Firestore
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const eventsRef = collection(db, COLLECTIONS.EVENTS);
        const q = query(
          eventsRef,
          where('date', '>=', now.toISOString()),
          orderBy('date', 'asc')
        );

        const snapshot = await getDocs(q);
        const loadedEvents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];

        setEvents(loadedEvents);
        setFilteredEvents(loadedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    loadEvents();
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation error:', error.message);
          setUserLocation({
            lat: 53.002668,
            lng: -2.179404
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.log('Geolocation is not supported by this browser');
      setUserLocation({
        lat: 53.002668,
        lng: -2.179404
      });
    }
  }, []);

  // Filter events when filters change
  useEffect(() => {
    const filterEvents = (events: Event[]) => {
      return events.filter(event => {
        // Search term filter
        const searchMatch = !filters.searchTerm || 
          event.name.toLowerCase().includes(filters.searchTerm.toLowerCase());

        // Date filter
        const eventDate = new Date(event.date);
        let dateMatch = true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (filters.dateFilter) {
          case 'today':
            dateMatch = eventDate.toDateString() === today.toDateString();
            break;
          case 'week': {
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            dateMatch = eventDate >= today && eventDate <= weekFromNow;
            break;
          }
          case 'month': {
            const monthFromNow = new Date(today);
            monthFromNow.setMonth(monthFromNow.getMonth() + 1);
            dateMatch = eventDate >= today && eventDate <= monthFromNow;
            break;
          }
        }

        // Ticket type filter
        let ticketMatch = true;
        if (filters.ticketType !== 'all') {
          const isFree = !event.ticketPrice || event.ticketPrice.toLowerCase() === 'free';
          ticketMatch = filters.ticketType === 'free' ? isFree : !isFree;
        }

        return searchMatch && dateMatch && ticketMatch;
      });
    };

    const filtered = filterEvents(events);
    setFilteredEvents(filtered);
  }, [filters, events]);

  return (
    <div className="relative h-screen">
      <div className="fixed top-4 right-4 z-10">
        <Link href="/admin">
          <Button variant="outline" className="bg-background/80 backdrop-blur-sm">
            <Settings className="w-4 h-4 mr-2" />
            Admin
          </Button>
        </Link>
      </div>
      <Sidebar 
        events={filteredEvents}
        filters={filters}
        onFilterChange={setFilters}
        onEventSelect={setSelectedEvent}
        isOpen={isFilterOpen}
        onOpenChange={setIsFilterOpen}
      />
      <AddEventButton map={mapInstance} />
      <MapView
        onEventSelect={setSelectedEvent}
        userLocation={userLocation}
        onMapLoad={setMapInstance}
      />
    </div>
  );
}