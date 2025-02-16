import React, { useEffect } from 'react';
import type { Event } from '@/lib/types';
import styles from './EventInfoWindow.module.css';
import './google-maps.css';

interface EventInfoWindowProps {
  event: Event;
  map: google.maps.Map;
  onClose?: () => void;
  position?: google.maps.LatLngLiteral;
}

export function EventInfoWindow({ event, map, onClose, position }: EventInfoWindowProps) {
  useEffect(() => {
    const infoWindow = new google.maps.InfoWindow({
      position: position || event.location,
      pixelOffset: new google.maps.Size(0, -30)
    });

    // Format date and time
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });

    const [hours, minutes] = event.startTime.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    const formattedTime = time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Create content
    const content = document.createElement('div');
    content.className = styles.infoWindow;
    content.innerHTML = `
      <h3 class="${styles.title}">${event.name || 'Event'}</h3>
      <p class="${styles.venueName}">${event.venueName}</p>
      <p class="${styles.dateTime}">${formattedDate} @ ${formattedTime}</p>
      ${event.ticketPrice ? `
        <div class="${styles.tickets}">
          <p class="${styles.ticketPrice}">Tickets: ${event.ticketPrice}</p>
          ${event.ticketUrl ? `
            <a href="${event.ticketUrl}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="${styles.link}"
            >
              Buy Tickets →
            </a>
          ` : ''}
        </div>
      ` : ''}
      ${!event.ticketPrice && event.eventUrl ? `
        <div class="${styles.tickets}">
          <a href="${event.eventUrl}" 
             target="_blank" 
             rel="noopener noreferrer"
             class="${styles.link}"
          >
            Event Details →
          </a>
        </div>
      ` : ''}
    `;

    infoWindow.setContent(content);
    infoWindow.open(map);

    infoWindow.addListener('closeclick', () => {
      onClose?.();
    });

    return () => {
      google.maps.event.clearListeners(infoWindow, 'closeclick');
      infoWindow.close();
    };
  }, [event, map, onClose, position]);

  return null;
}