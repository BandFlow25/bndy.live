'use client'
import { useState, useEffect } from "react";
import { Event } from "@/lib/types";
import { MapView } from "@/components/MapView";
import { Sidebar } from "@/components/Sidebar";
import { AddEventButton } from '@/components/events/AddEventButton';
import { FilterButton } from '@/components/ui/eventquickfilterbutton';
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

// Helper function to get this week's date range
function getThisWeekDateRange() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const startDate = new Date(now);
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + (7 - endDate.getDay()));

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
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

  // Initialize with this week's date range
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>(getThisWeekDateRange());

  const setDateFilter = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  };

  // Load events from Firestore when date range changes
  useEffect(() => {
    const loadEvents = async () => {
      try {
        console.log(`Fetching events for date range: ${dateRange.startDate} - ${dateRange.endDate}`);

        const eventsRef = collection(db, COLLECTIONS.EVENTS);
        const q = query(
          eventsRef,
          where('date', '>=', dateRange.startDate),
          where('date', '<=', dateRange.endDate),
          orderBy('date', 'asc')
        );

        const snapshot = await getDocs(q);
        const loadedEvents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];

        console.log(`Loaded ${loadedEvents.length} events:`, loadedEvents);

        setEvents(loadedEvents);
        setFilteredEvents(loadedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    loadEvents();
  }, [dateRange]); // Reload events when date range changes

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
      
      <AddEventButton map={mapInstance} />
      <FilterButton onFilterChange={setDateFilter} />
      <MapView
        onEventSelect={setSelectedEvent}
        userLocation={userLocation}
        onMapLoad={setMapInstance}
        dateRange={dateRange}
      />
    </div>
  );
}