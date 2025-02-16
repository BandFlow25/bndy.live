// src/components/map/InfoWindows/types.ts
import { Event } from "@/lib/types";

export interface BaseInfoWindowProps {
  event: Event;
  map: google.maps.Map;
  onClose?: () => void;
  position?: google.maps.LatLngLiteral;
}

export interface InfoWindowManagerProps extends BaseInfoWindowProps {
  mode: 'user';  // Removed 'admin' since we're not using it anymore
}

export interface InfoWindowTemplates {
  standard: (title: string, subtitle?: string, buttons?: InfoWindowButton[]) => string;
  loading: (title: string, subtitle?: string) => string;
  error: (title: string, error: string) => string;
  success: (title: string, message: string) => string;
}

export interface InfoWindowButton {
  id: string;
  text: string;
  variant: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
}