// components/GigList.tsx
import { Clock, Calendar, Ticket } from 'lucide-react';
import { Gig } from '@/lib/types';

interface GigListProps {
  gigs: Gig[];
  onGigSelect: (gig: Gig | null) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatTime(timeStr: string): string {
  return timeStr;  // You can enhance this if needed
}

export function GigList({ gigs, onGigSelect }: GigListProps) {
  return (
    <div className="space-y-4">
      {gigs.map((gig) => (
        <div
          key={gig.id}
          className="p-4 rounded-lg bg-card hover:bg-accent cursor-pointer"
          onClick={() => onGigSelect(gig)}
        >
          <h3 className="font-semibold">{gig.bandName}</h3>
          <p className="text-sm text-muted-foreground">{gig.venueName}</p>
          <div className="flex items-center gap-2 mt-2 text-sm">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(gig.date)}</span>
            <Clock className="w-4 h-4 ml-2" />
            <span>{formatTime(gig.time)}</span>
          </div>
          {gig.ticketPrice && (
            <div className="flex items-center gap-2 mt-1 text-sm">
              <Ticket className="w-4 h-4" />
              <span>£{gig.ticketPrice}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}