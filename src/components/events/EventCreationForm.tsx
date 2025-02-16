import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { createEvent } from '@/lib/services/event-service';
import { VenueStep } from './steps/VenueStep';
import { ArtistStep } from './steps/ArtistStep';
import { EventDetailsStep } from './steps/EventDetailsStep';
import { NonBand, Venue } from '@/lib/types';

export interface EventFormData {
  venue: Venue;
  artists: NonBand[];
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  ticketPrice?: string;
  ticketUrl?: string;
  eventUrl?: string;
}

interface EventCreationFormProps {
  map: google.maps.Map;
  onSuccess: () => void;
}

// Helper function to convert 24h time to 12h format - Moved to top
const convertTo12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  let hours12 = hours % 12;
  hours12 = hours12 === 0 ? 12 : hours12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export function EventCreationForm({ map, onSuccess }: EventCreationFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const form = useForm<EventFormData>({
    defaultValues: {
      artists: [],
      venue: {
        name: '',
        location: { lat: 0, lng: 0 }
      } as Venue,
      name: '',
      date: '',
      startTime: '19:00',
      endTime: '22:00'
    }
  });

  // Dynamic title based on form state
  const title = useMemo(() => {
    const formData = form.getValues();
    
    // Step 1: Just show default title
    if (step === 1 && !formData.venue.name) {
      return "Create New Event";
    }
    
    // After venue selection
    if (step === 1 && formData.venue.name) {
      return `Event @ ${formData.venue.name}`;
    }

    // After artist selection
    if (step === 2 || (step === 3 && !formData.date)) {
      const artistDisplay = formData.artists.length > 1 
        ? "Multiple Artists" 
        : formData.artists[0]?.name || "Event";
      return `${artistDisplay} @ ${formData.venue.name}`;
    }

    // After date/time selection
    if (step === 3 && formData.date) {
      const artistDisplay = formData.artists.length > 1 
        ? "Multiple Artists" 
        : formData.artists[0]?.name;
      const dateStr = format(new Date(formData.date), 'EEE, dd MMM');
      return `${artistDisplay} @ ${formData.venue.name} - ${dateStr}${formData.startTime ? ` @ ${convertTo12Hour(formData.startTime)}` : ''}`;
    }

    return "Create New Event";
  }, [step, form.watch(['venue', 'artists', 'date', 'startTime'])]);

  const onSubmit = async (data: EventFormData) => {
    setLoading(true);
    try {
      await createEvent(data);
      onSuccess();
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="mb-6 text-lg font-semibold">{title}</div>
      
      {step === 1 && (
        <VenueStep
          map={map}
          form={form}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <ArtistStep
          form={form}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <EventDetailsStep
          form={form}
          loading={loading}
          onSubmit={onSubmit}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
}