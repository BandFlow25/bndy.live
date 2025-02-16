// src/components/map/InfoWindows/InfoWindowManager.tsx
import { UserEventInfoWindow } from './UserEventInfoWindow';
import { InfoWindowManagerProps } from './types';

export function InfoWindowManager({ mode, ...props }: InfoWindowManagerProps) {
  // We only have user mode now, so we can directly return the UserEventInfoWindow
  return <UserEventInfoWindow {...props} />;
}