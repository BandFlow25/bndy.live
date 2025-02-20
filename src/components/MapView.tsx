import React, { useCallback, useState, useRef, useEffect } from 'react';
import { MarkerClusterer, GridAlgorithm } from '@googlemaps/markerclusterer';
import { Event } from "@/lib/types";
import { EventInfoWindow } from './map/EventInfoWindow';
import { GoogleMapsWrapper } from './map/GoogleMapsWrapper';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import './map/google-maps.css'

interface MapViewProps {
  onEventSelect: (event: Event | null) => void;
  userLocation: google.maps.LatLngLiteral | null;
  onMapLoad?: (map: google.maps.Map | null) => void;
  dateRange?: { startDate: string; endDate: string };
}

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
        gestureHandling: 'greedy',
        clickableIcons: false,
        styles: [
          { featureType: "all", elementType: "all", stylers: [{ hue: "#242a38" }] },
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
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

function ClusteredMarkers({
  map,
  events,
  onMarkerClick
}: {
  map: google.maps.Map;
  events: Event[];
  onMarkerClick: (event: Event, allEvents?: Event[]) => void;
}) {
  useEffect(() => {
    // Group events by venue location
    const eventsByLocation = events.reduce((acc, event) => {
      const key = `${event.location.lat},${event.location.lng}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(event);
      return acc;
    }, {} as Record<string, Event[]>);

    // Create markers for each unique location
    const markers = Object.entries(eventsByLocation).map(([locationKey, locationEvents]) => {
      const [lat, lng] = locationKey.split(',').map(Number);
      
      return new google.maps.Marker({
        position: { lat, lng },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#FF6B00",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#FFFFFF",
        },
        label: locationEvents.length > 1 ? {
          text: String(locationEvents.length),
          color: "#FFFFFF",
          fontSize: "12px",
          fontWeight: "bold"
        } : undefined,
        map
      });
    });

    // Add click listeners
    Object.entries(eventsByLocation).forEach(([locationKey, locationEvents], index) => {
      markers[index].addListener('click', () => {
        onMarkerClick(locationEvents[0], locationEvents);
      });
    });

    // Create clusterer with the markers
    const clusterer = new MarkerClusterer({
      map,
      markers,
      algorithm: new GridAlgorithm({
        maxZoom: 15,
        gridSize: 60
      }),
      renderer: {
        render: ({ count, position }) => {
          return new google.maps.Marker({
            position,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#FF6B00",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#FFFFFF",
              scale: count > 1 ? 22 : 10,
            },
            label: count > 1 ? {
              text: String(count),
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: "bold"
            } : undefined
          });
        }
      }
    });

    // Cleanup
    return () => {
      clusterer.clearMarkers();
      markers.forEach(marker => {
        google.maps.event.clearListeners(marker, 'click');
        marker.setMap(null);
      });
    };
  }, [map, events, onMarkerClick]);

  return null;
}

const defaultCenter = { lat: 54.093409, lng: -2.89479 };

export function MapView({ onEventSelect, userLocation, onMapLoad, dateRange }: MapViewProps) {
  const [center, setCenter] = useState<google.maps.LatLngLiteral>(defaultCenter);
  const [zoom, setZoom] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [venueEvents, setVenueEvents] = useState<Event[]>([]);
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

  // Fetch events within map bounds and date range
  useEffect(() => {
    const fetchEvents = async () => {
      if (!mapInstance) return;
      if (!dateRange) return;

      try {
        const bounds = mapInstance.getBounds();
        if (!bounds) return;

        // Query events with date filter
        const eventsRef = collection(db, COLLECTIONS.EVENTS);
        const q = query(
          eventsRef,
          where('date', '>=', dateRange.startDate),
          where('date', '<=', dateRange.endDate),
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

    if (mapInstance && dateRange) {
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
  }, [mapInstance, dateRange]);

  const handleMarkerClick = useCallback((event: Event, venueEvents?: Event[]) => {
    if (!mapInstance) return;
  
    mapInstance.panTo(event.location);
    setSelectedEvent(event);
    setVenueEvents(venueEvents || []);
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
              <ClusteredMarkers
                map={map}
                events={events}
                onMarkerClick={handleMarkerClick}
              />
              {selectedEvent && mapInstance && (
               <EventInfoWindow
                 event={selectedEvent}
                 allVenueEvents={venueEvents}
                 map={mapInstance}
                 onClose={handleInfoWindowClose}
                 onEventChange={(newEvent) => {
                   setSelectedEvent(newEvent);
                   onEventSelect(newEvent);
                 }}
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