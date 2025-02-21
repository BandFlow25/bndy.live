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


const isIOS = () => {
  // Get iOS version if possible
  const iOSMatch = navigator.userAgent.match(/OS (\d+)_/);
  const iOSVersion = iOSMatch ? parseInt(iOSMatch[1], 10) : 0;
  
  const isIOSDevice = [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform) || 
  (navigator.userAgent.includes("Mac") && "ontouchend" in document);

  return { isIOSDevice, version: iOSVersion };
};


function MapComponent({
  center,
  zoom,
  onMapLoad,
  children,
  className
}: {
  center: google.maps.LatLngLiteral;
  zoom: number;
  onMapLoad?: (map: google.maps.Map) => void;
  children?: (map: google.maps.Map) => React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const { isIOSDevice, version } = isIOS();

  useEffect(() => {
    if (ref.current && !map) {
      // Create a wrapper div for iOS fix
      const mapContainer = isIOSDevice && version < 15 ? 
        document.createElement('div') : 
        ref.current;

      if (isIOSDevice && version < 15) {
        mapContainer.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
        `;
        ref.current.appendChild(mapContainer);
      }

      // Add slight delay for older iOS versions
      const initMap = () => {
        const mapInstance = new window.google.maps.Map(mapContainer, {
          center,
          zoom,
          gestureHandling: 'greedy',
          clickableIcons: false,
          maxZoom: 18,
          minZoom: 3,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          tilt: 0,
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
      };

      if (isIOSDevice && version < 15) {
        // Add delay for older iOS
        setTimeout(initMap, 100);
      } else {
        initMap();
      }
    }
  }, [ref, map, center, zoom, onMapLoad]);

  // Force map resize/recenter after initial render on iOS
  useEffect(() => {
    const { isIOSDevice, version } = isIOS();
    if (isIOSDevice && version < 15 && map) {
      const resizeTimer = setTimeout(() => {
        google.maps.event.trigger(map, 'resize');
        map.setCenter(center);
      }, 300);

      return () => clearTimeout(resizeTimer);
    }
  }, [map, center]);

  return (
    <>
      <div 
        ref={ref} 
        className="absolute inset-0 w-full h-full"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 0,
        }}
      />
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
  const markersRef = useRef<google.maps.Marker[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);

  useEffect(() => {
    // Clean up previous markers and clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Group events by venue location
    const eventsByLocation = events.reduce((acc, event) => {
      const key = `${event.location.lat},${event.location.lng}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(event);
      return acc;
    }, {} as Record<string, Event[]>);

    // Store total events count for each marker for clustering
    const markerEventCounts = new Map<google.maps.Marker, number>();

    // Create markers with optimized settings
    const markers = Object.entries(eventsByLocation).map(([locationKey, locationEvents]) => {
      const [lat, lng] = locationKey.split(',').map(Number);

      const marker = new google.maps.Marker({
        position: { lat, lng },
        optimized: true,
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
        } : undefined
      });

      // Store the event count for this marker
      markerEventCounts.set(marker, locationEvents.length);

      // Add click listener
      marker.addListener('click', () => {
        onMarkerClick(locationEvents[0], locationEvents);
      });

      markersRef.current.push(marker);
      return marker;
    });

    // Create clusterer with optimized settings
    clustererRef.current = new MarkerClusterer({
      map,
      markers,
      algorithm: new GridAlgorithm({
        maxZoom: 16,
        gridSize: 60
      }),
      onClusterClick: (_, cluster) => {
        const position = cluster.position;
        map.panTo(position);
        map.setZoom(map.getZoom()! + 1);
      },
      renderer: {
        render: ({ count, position, markers: clusterMarkers }) => {
          // Calculate total events in the cluster
          const totalEvents = clusterMarkers.reduce((total, marker) => {
            // Ensure marker is a google.maps.Marker before getting from Map
            if (marker instanceof google.maps.Marker) {
              return total + (markerEventCounts.get(marker) || 1);
            }
            return total;
          }, 0);

          return new google.maps.Marker({
            position,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#FF6B00",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#FFFFFF",
              scale: totalEvents > 1 ? 22 : 10,
            },
            label: totalEvents > 1 ? {
              text: String(totalEvents),
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: "bold"
            } : undefined,
            optimized: true
          });
        }
      }
    });

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      markersRef.current.forEach(marker => {
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

        console.log("MapView Query:", q);
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

  // iOS fix attempt
  useEffect(() => {
    if (isIOS()) {
      // Force a resize event after a short delay
      setTimeout(() => {
        if (mapInstance) {
          google.maps.event.trigger(mapInstance, 'resize');
          if (center) {
            mapInstance.setCenter(center);
          }
        }
      }, 100);
    }
  }, [mapInstance, center]);

  const handleMarkerClick = useCallback((event: Event, venueEvents?: Event[]) => {
    if (!mapInstance) return;

    // Move map down slightly to ensure info window visibility
    const newCenter = {
      lat: event.location.lat - 0.002, // Adjust value based on zoom level
      lng: event.location.lng
    };

    mapInstance.panTo(newCenter);
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
    <div className="fixed inset-0 w-full overflow-hidden bg-[#242a38]">
      <GoogleMapsWrapper apiKey={apiKey}>
        <MapComponent 
          center={center} 
          zoom={zoom} 
          onMapLoad={handleMapLoad}
        >
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