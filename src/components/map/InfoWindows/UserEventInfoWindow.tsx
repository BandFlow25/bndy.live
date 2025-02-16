// src/components/map/InfoWindows/UserEventInfoWindow.tsx
import { useEffect, useCallback } from 'react';
import { BaseInfoWindowProps } from './types';
import { BaseInfoWindowComponent } from './BaseInfoWindowComponent';
import { createTemplates } from './templates';

export function UserEventInfoWindow({ event, map, onClose, position }: BaseInfoWindowProps) {
  const createInfoWindow = useCallback(() => {
    const templates = createTemplates();
    const infoWindow = new BaseInfoWindowComponent(map, position || event.location);
    
    // Format the event information
    const eventDate = new Date(event.date).toLocaleDateString();
    const content = templates.standard(
      // For LiveEvent use bandName, for BandEvent we'll need to fetch band name
      'source' in event && event.source === 'bndy.live' ? event.bandName : 'Band Event',
      `${eventDate} ${event.time}`
    );

    infoWindow.setContentAndPosition(content);
    infoWindow.addCloseListener(() => onClose?.());
    infoWindow.open();

    return infoWindow;
  }, [event, map, position, onClose]);

  useEffect(() => {
    const infoWindow = createInfoWindow();
    return () => infoWindow.close();
  }, [createInfoWindow]);

  return null;
}