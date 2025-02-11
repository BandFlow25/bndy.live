'use client'
import { useState, useEffect } from "react";
import { Gig, GigFilters } from "@/lib/types";
import { MapView } from "@/components/MapView";
import { Sidebar } from "@/components/Sidebar";
import { loadMockGigs, filterGigs } from "@/lib/services/mock-data";

export default function Home() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>([]);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);  // Added for Sidebar
  const [filters, setFilters] = useState<GigFilters>({
    searchTerm: "",
    genre: "",
    ticketType: "all",
    dateFilter: "all"  // Removed searchRadius as it's not in GigFilters type
  });
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);

  // Load mock data
  useEffect(() => {
    const loadData = async () => {
      const mockGigs = await loadMockGigs();
      setGigs(mockGigs);
      setFilteredGigs(mockGigs);
    };
    loadData();
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
          // Set default location - e.g., center of Stoke-on-Trent
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
      // Set default location
      setUserLocation({
        lat: 53.002668,
        lng: -2.179404
      });
    }
  }, []);

  // Filter gigs when filters change
  useEffect(() => {
    const filtered = filterGigs(gigs, {
      searchTerm: filters.searchTerm,
      genre: filters.genre,
      dateFilter: filters.dateFilter,
      postcode: filters.postcode
    });
    console.log(`Filtered gigs by date (${filters.dateFilter}):`, filtered.length);
    // Log first few gigs to see dates
    filtered.slice(0, 3).forEach(gig => 
      console.log(`Sample gig: ${gig.bandName} at ${gig.venueName} on ${gig.date}`)
    );
    setFilteredGigs(filtered);
  }, [filters, gigs]);

  return (
    <div className="relative h-screen">
      <Sidebar 
        gigs={filteredGigs}
        filters={filters}
        onFilterChange={setFilters}
        onGigSelect={setSelectedGig}
        isOpen={isFilterOpen}
        onOpenChange={setIsFilterOpen}
      />
      <MapView
        gigs={filteredGigs}
        selectedGig={selectedGig}
        onGigSelect={setSelectedGig}
        userLocation={userLocation}
      />
    </div>
  );
}