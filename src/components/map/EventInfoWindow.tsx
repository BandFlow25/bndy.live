import React, { useEffect, useState } from 'react';
import type { Event, Artist, Venue } from '@/lib/types';
import styles from './EventInfoWindow.module.css';
import { formatTime, formatEventDate } from '@/lib/utils/date-utils';
import { MapPin, Clock, ExternalLink, Ticket } from 'lucide-react';
import { ChevronDown, ChevronUp, Building2, Music } from 'lucide-react';
import { getVenueById } from '@/lib/services/venue-service';
import { getArtistById } from '@/lib/services/artist-service';
import { extractFacebookUsername, getFacebookProfilePicUrl, checkImageExists } from '@/lib/utils/profilepic-utils';


interface EventInfoWindowProps {
  event: Event;
  allVenueEvents?: Event[];
  map: google.maps.Map;
  onClose?: () => void;
  onEventChange?: (newEvent: Event) => void;
  position?: google.maps.LatLngLiteral;
}

export function EventInfoWindow({
  event,
  allVenueEvents,
  map,
  onClose,
  onEventChange,
  position
}: EventInfoWindowProps) {
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [showMore, setShowMore] = useState(false);

  const [artist, setArtist] = useState<Artist | null>(null);
  const [shouldShowEventName, setShouldShowEventName] = useState(false);
  const hasMultipleEvents = allVenueEvents && allVenueEvents.length > 1;

  // Track current event index
  useEffect(() => {
    if (allVenueEvents) {
      const index = allVenueEvents.findIndex(e => e.id === event.id);
      if (index !== -1) {
        setCurrentEventIndex(index);
      }
    }
  }, [event.id, allVenueEvents]);

  useEffect(() => {
    async function fetchDetails() {
      try {
        if (event.venueId) {
          console.log('Fetching venue:', event.venueId);
          const venueData = await getVenueById(event.venueId);
          console.log('Venue data:', venueData);
          setVenue(venueData);
        }

        if (event.artistIds?.length) {
          console.log('Fetching artist:', event.artistIds[0]);
          const artistData = await getArtistById(event.artistIds[0]);
          console.log('Artist data:', artistData);
          setArtist(artistData);

          if (artistData) {
            const defaultName = `${artistData.name} @ ${event.venueName}`;
            setShouldShowEventName(event.name !== defaultName);
          }
        }
      } catch (error) {
        console.error('Error fetching details:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
      }
    }
    fetchDetails();
  }, [event.venueId, event.artistIds, event.name, event.venueName]);

  useEffect(() => {
    const infoWindow = new google.maps.InfoWindow({
      position: position || event.location,
      pixelOffset: new google.maps.Size(0, -40),
      maxWidth: 320,
    });

    // SVG icons for inline use
    const mapPinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    const clockSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
    const ticketSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M3 7v2a3 3 0 1 1 0 6v2c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-2a3 3 0 1 1 0-6V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z"></path><path d="M13 5v2"></path><path d="M13 17v2"></path><path d="M13 11v2"></path></svg>`;
    const externalLinkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
    const chevronDownSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary animate-glow"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    const chevronUpSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary animate-glow"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
    const buildingSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 22v-4h6v4"></path></svg>`;
    const musicSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`;


    const content = document.createElement('div');
    content.className = styles.infoWindow;


    content.innerHTML = `
    <div class="w-[300px] p-4 bg-[#1a1f2d] border border-[#FF6B00] rounded-lg shadow-lg relative">
      <button id="customCloseButton" class="absolute top-2 right-4 text-white bg-transparent hover:text-orange-500 transition">
        ✖
      </button>
  
      <div class="space-y-3">
        <!-- Event Title/Artist Section -->
        <div class="flex items-start justify-between">
          <div class="space-y-1">
            ${shouldShowEventName ? `
              <h3 class="font-semibold text-lg text-white mb-2">
                ${event.name}
              </h3>
            ` : ''}
            
            <!-- Artist, Venue, and Time Info -->
            <div class="flex items-start gap-3">
              ${artist?.facebookUrl ? `
                <img 
                  src="${getFacebookProfilePicUrl(extractFacebookUsername(artist.facebookUrl) || '')}" 
                  alt="${artist?.name || 'Artist'}"
                  class="w-16 h-16 rounded-full border border-primary flex-shrink-0"
                  onerror="this.style.display='none'"
                />
              ` : ''}
              <div class="flex flex-col gap-1">
                <span class="font-semibold text-base text-white">${artist?.name || 'Loading...'}</span>
                <div class="flex items-center gap-1 text-sm text-muted-foreground">
                  ${mapPinSvg}
                  <span>${venue?.name || 'Loading...'}</span>
                  <a href="https://www.google.com/maps/search/?api=1&query=${event.location.lat},${event.location.lng}"
                     target="_blank"
                     rel="noopener noreferrer"
                     class="hover:text-primary transition-colors"
                  >
                    ${externalLinkSvg}
                  </a>
                </div>
                <div class="flex items-center gap-1 text-sm text-muted-foreground">
                  ${clockSvg}
                  <span>${formatEventDate(new Date(event.date))} @ ${formatTime(event.startTime)}</span>
                  ${event.endTime ? `<span>- ${formatTime(event.endTime)}</span>` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
  
       
  
        <!-- Ticket Section -->
        <div class="flex items-center gap-1 text-sm text-white">
          ${ticketSvg}
          <span>${event.ticketPrice ? `£${event.ticketPrice}` : '£ree event'}</span>
          ${event.ticketUrl ? `
            <a href="${event.ticketUrl}" target="_blank" rel="noopener noreferrer" 
               class="ml-2 text-primary hover:underline">
              Get Tickets
            </a>
          ` : ''}
        </div>
  
        ${event.description ? `
          <p class="text-sm text-muted-foreground mt-2">
            ${event.description}
          </p>
        ` : ''}
  
        ${event.eventUrl ? `
          <p class="text-sm text-primary mt-2">
            <a href="${event.eventUrl}" target="_blank" rel="noopener noreferrer"
               class="text-primary hover:underline flex items-center gap-1">
              Event Details ${externalLinkSvg}
            </a>
          </p>
        ` : ''}
  
        ${hasMultipleEvents ? `
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <button 
              id="prevEventButton"
              class="text-primary hover:text-primary/80 transition-colors ${currentEventIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
            >
              Previous
            </button>
            <span class="text-sm text-muted-foreground">
              ${currentEventIndex + 1} of ${allVenueEvents?.length}
            </span>
            <button 
              id="nextEventButton"
              class="text-primary hover:text-primary/80 transition-colors ${currentEventIndex === (allVenueEvents?.length ?? 0) - 1 ? 'opacity-50 cursor-not-allowed' : ''}"
            >
              Next
            </button>
          </div>
        ` : ''}
  
        <!-- Expandable "See More" Section -->
        <div class="mt-4">
          <button id="toggleSeeMore"
                  class="w-full flex items-center justify-center gap-1 text-muted-foreground text-sm hover:text-white transition">
            See more
            <span id="chevronIcon" class="transition-transform duration-300">${chevronDownSvg}</span>
          </button>
  
          <div id="seeMoreOptions" class="hidden mt-3 flex justify-center gap-3" style="opacity: 0; transition: opacity 0.3s ease-in-out;">
            ${artist?.id ? `
              <a href="/artist/${artist.id}"
                 class="flex items-center gap-2 px-4 py-2 text-sm border border-primary rounded-lg transition hover:bg-primary hover:text-black">
                ${musicSvg} Artist Page
              </a>
            ` : ''}  
            ${venue?.id ? `
              <a href="/venue/${venue.id}"
                 class="flex items-center gap-2 px-4 py-2 text-sm border border-primary rounded-lg transition hover:bg-primary hover:text-black">
                ${buildingSvg} Venue Page
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;



    infoWindow.setContent(content);
    infoWindow.open(map);


    google.maps.event.addListener(infoWindow, 'domready', () => {
      const toggleButton = document.getElementById("toggleSeeMore");
      const seeMoreOptions = document.getElementById("seeMoreOptions");
      const chevronIcon = document.getElementById("chevronIcon");
    
      if (toggleButton && seeMoreOptions && chevronIcon) {
        toggleButton.addEventListener("click", () => {
          const isHidden = seeMoreOptions.classList.contains("hidden");
          
          // Toggle visibility
          seeMoreOptions.classList.toggle("hidden");
          
          // Handle opacity transition
          if (!isHidden) {
            seeMoreOptions.style.opacity = "0";
          } else {
            setTimeout(() => {
              seeMoreOptions.style.opacity = "1";
            }, 10);
          }
          
          // Update chevron and animation
          chevronIcon.innerHTML = isHidden ? chevronUpSvg : chevronDownSvg;
          chevronIcon.style.filter = isHidden ? 
            'drop-shadow(0 0 5px rgba(255, 107, 0, 0.8))' : 
            'none';
          chevronIcon.style.transition = 'transform 0.3s ease, filter 0.3s ease';
          chevronIcon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0)';
        });
      }
    });

    // Add event listeners after content is rendered
    requestAnimationFrame(() => {
      // Close button handler
      const closeButton = document.getElementById("customCloseButton");
      if (closeButton) {
        closeButton.addEventListener("click", () => {
          infoWindow.close();
          if (onClose) onClose();
        });
      }

      // Navigation button handlers 
      if (hasMultipleEvents) {
        const prevButton = document.getElementById("prevEventButton");
        const nextButton = document.getElementById("nextEventButton");

        if (prevButton) {
          prevButton.addEventListener("click", () => {
            if (currentEventIndex > 0 && allVenueEvents) {
              const newEvent = allVenueEvents[currentEventIndex - 1];
              infoWindow.close();
              if (onEventChange) onEventChange(newEvent);
            }
          });
        }

        if (nextButton) {
          nextButton.addEventListener("click", () => {
            if (allVenueEvents && currentEventIndex < allVenueEvents.length - 1) {
              const newEvent = allVenueEvents[currentEventIndex + 1];
              infoWindow.close();
              if (onEventChange) onEventChange(newEvent);
            }
          });
        }
      }
    });

    return () => {
      infoWindow.close();
    };
  }, [event, map, position, artist, venue, currentEventIndex, hasMultipleEvents, allVenueEvents, onClose, onEventChange]);

  return null;
}