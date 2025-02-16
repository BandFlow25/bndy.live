// src/components/MapView.tsx
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Event } from "@/lib/types";
import { InfoWindowManager } from './map/InfoWindows/InfoWindowManager';
import { GoogleMapsWrapper } from './map/GoogleMapsWrapper';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { useMemo } from 'react';

function MapComponent({
  center,
  zoom,
  onMapLoad,
  children
}: {
  center: google.maps.LatLngLiteral;
  zoom: number;
  onMapLoad?: (map: google.maps.Map) => void;
  children?: (map: google.maps.Map) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();

  useEffect(() => {
    if (ref.current && !map) {
      const mapInstance = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        styles: [
          { featureType: "all", elementType: "all", stylers: [{ hue: "#242a38" }] },
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "on" }] },
          { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
          { featureType: "road", elementType: "labels", stylers: [{ visibility: "on" }] },
          { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "on" }] },
          { featureType: "poi.business", elementType: "all", stylers: [{ visibility: "off" }] }
        ]
      });
      setMap(mapInstance);
      if (onMapLoad) onMapLoad(mapInstance);
    }
  }, [ref, map, center, zoom, onMapLoad]);

  useEffect(() => {
    if (map) {
      map.setCenter(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);

  return (
    <>
      <div ref={ref} style={{ width: '100%', height: '100vh' }} />
      {map && children?.(map)}
    </>
  );
}

function Marker({
  map,
  position,
  onClick
}: {
  map: google.maps.Map;
  position: google.maps.LatLngLiteral;
  onClick?: () => void;
}) {
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    markerRef.current = new google.maps.Marker({
      map,
      position,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#FF6B00",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "#FFFFFF",
      }
    });

    if (onClick) {
      markerRef.current.addListener('click', onClick);
    }

    return () => {
      if (markerRef.current) {
        google.maps.event.clearListeners(markerRef.current, 'click');
        markerRef.current.setMap(null);
      }
    };
  }, [map, position, onClick]);

  return null;
}

interface MapViewProps {
  onEventSelect: (event: Event | null) => void;
  userLocation: google.maps.LatLngLiteral | null;
  onMapLoad?: (map: google.maps.Map | null) => void;
}

const defaultCenter = { lat: 54.093409, lng: -2.89479 };

export function MapView({ onEventSelect, userLocation, onMapLoad }: MapViewProps) {
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Handle map instance
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
    if (onMapLoad) onMapLoad(map);
  }, [onMapLoad]);

  // Handle user location
  useEffect(() => {
    if (!userLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setCenter(newLocation);
            setZoom(12);
          },
          (error) => {
            console.error('Error getting location:', error);
            setError('Could not get your location. Showing default view.');
          }
        );
      }
    } else {
      setCenter(userLocation);
      setZoom(12);
    }
  }, [userLocation]);

  // Fetch events within map bounds
  useEffect(() => {
    const fetchEvents = async () => {
      if (!mapInstance) return;

      try {
        const bounds = mapInstance.getBounds();
        if (!bounds) return;

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const eventsRef = collection(db, COLLECTIONS.EVENTS);
        const q = query(
          eventsRef,
          where('date', '>=', now.toISOString()),
          orderBy('date', 'asc'),
          limit(100)
        );

        const snapshot = await getDocs(q);
        const loadedEvents = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Event[];

        // Filter events within bounds
        const filteredEvents = loadedEvents.filter(event => {
          return bounds.contains({
            lat: event.location.lat,
            lng: event.location.lng
          });
        });

        setEvents(filteredEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    if (mapInstance) {
      // Initial fetch
      fetchEvents();

      // Add bounds changed listener
      const listener = mapInstance.addListener('bounds_changed', () => {
        fetchEvents();
      });

      return () => {
        google.maps.event.removeListener(listener);
      };
    }
  }, [mapInstance]);

  const handleMarkerClick = useCallback((event: Event) => {
    if (!mapInstance) return;
    
    mapInstance.panTo(event.location);
    setSelectedEvent(event);
    onEventSelect(event);
  }, [mapInstance, onEventSelect]);

  const handleInfoWindowClose = useCallback(() => {
    setSelectedEvent(null);
    onEventSelect(null);
  }, [onEventSelect]);

  if (!apiKey) {
    console.error('Google Maps API key is missing');
    return <div>Map cannot be loaded</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="relative">
      <GoogleMapsWrapper apiKey={apiKey}>
        <MapComponent center={center} zoom={zoom} onMapLoad={handleMapLoad}>
          {(map) => (
            <>
              {events.map((event) => (
                <Marker
                  key={event.id}
                  map={map}
                  position={event.location}
                  onClick={() => handleMarkerClick(event)}
                />
              ))}
              {selectedEvent && mapInstance && (
                <InfoWindowManager
                  mode="user"
                  event={selectedEvent}
                  map={mapInstance}
                  onClose={handleInfoWindowClose}
                  position={selectedEvent.location}
                />
              )}
            </>
          )}
        </MapComponent>
      </GoogleMapsWrapper>
    </div>
  );
}