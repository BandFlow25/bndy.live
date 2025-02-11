'use client'
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Wrapper } from "@googlemaps/react-wrapper";
import { Gig } from "@/lib/types";

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
          { featureType: "all", elementType: "all", stylers: [{ hue: "#242a38" }] }, // YOUR ORIGINAL STYLING
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "on" }] }, // HIDE POINTS OF INTEREST
          { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] }, // HIDE TRANSIT LABELS
          { featureType: "road", elementType: "labels", stylers: [{ visibility: "on" }] }, // HIDE ROAD LABELS
          { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "on" }] }, // HIDE ADMIN LABELS
          { featureType: "poi.business", elementType: "all", stylers: [{ visibility: "off" }] } // HIDE BUSINESS LABELS
        ]
      });
      setMap(mapInstance);
      if (onMapLoad) onMapLoad(mapInstance);
    }
  }, [ref, map, center, zoom, onMapLoad]);

  // Update center and zoom when they change
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

function Marker({ map, position, onClick }: {
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
  gigs: Gig[];
  
  onGigSelect: (gig: Gig | null) => void;
  userLocation: google.maps.LatLngLiteral | null;
}

// Default center (UK)
const defaultCenter = { lat: 54.093409, lng: -2.89479 };

export function MapView({ gigs, onGigSelect, userLocation }: MapViewProps) {
  console.log(`MapView received ${gigs.length} gigs`);
  // Log unique venues to check for duplicates
  const uniqueVenues = new Set(gigs.map(gig => gig.venueName));
  console.log(`Number of unique venues: ${uniqueVenues.size}`);
  console.log("Unique venues:", Array.from(uniqueVenues));
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
            setZoom(12); // Zoom in when we get user location
          },
          (error) => {
            console.error('Error getting location:', error);
            setError('Could not get your location. Showing all gigs.');
          }
        );
      }
    } else {
      setCenter(userLocation);
      setZoom(12);
    }
  }, [userLocation]);

  const handleMarkerClick = useCallback((gig: Gig, map: google.maps.Map) => {
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow({
        pixelOffset: new google.maps.Size(0, -30)
      });
      infoWindowRef.current.addListener('closeclick', () => onGigSelect(null));
    }

    const formattedDate = new Date(gig.date).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const content = `
      <div style="padding: 16px; min-width: 200px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <p style="font-size: 14px; margin-bottom: 8px; color: #666;">${gig.venueName}</p>
        <p style="font-size: 14px; color: #666;">
          ${formattedDate} at ${gig.time}
        </p>
      </div>
    `;

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.setPosition(gig.location);
    infoWindowRef.current.open(map);
    onGigSelect(gig);
  }, [onGigSelect]);

  useEffect(() => {
    return () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
    };
  }, []);

  if (!apiKey) {
    console.error('Google Maps API key is missing');
    return <div>Map cannot be loaded</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <Wrapper apiKey={apiKey}>
      <MapComponent
        center={center}
        zoom={zoom}
      >
        {(map) => (
          <>
            {gigs.map((gig) => (
              <Marker
                key={gig.id}
                map={map}
                position={gig.location}
                onClick={() => handleMarkerClick(gig, map)}
              />
            ))}
          </>
        )}
      </MapComponent>
    </Wrapper>
  );
}
