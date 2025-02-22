// src/components/events/AddEventButton.tsx
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetHeader
} from "@/components/ui/sheet";
import { useState } from 'react';
import { NewEventWizard } from './NewEventWizard';  // Make sure this path is correct
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface AddEventButtonProps {
  map: google.maps.Map | null;
}

export function AddEventButton({ map }: AddEventButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-4 right-4 z-10 bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </SheetTrigger>
      <SheetContent 
  side="left" 
  className="w-[400px] sm:w-[540px] bg-background/95 backdrop-blur-sm safari-modal"
>
        <VisuallyHidden>
          <SheetHeader>
            <SheetTitle>Create New Event</SheetTitle>
            <SheetDescription>
              Create a new event by selecting a venue, artists, and event details
            </SheetDescription>
          </SheetHeader>
        </VisuallyHidden>
        {map && <NewEventWizard map={map} onSuccess={() => setIsOpen(false)} />}
      </SheetContent>
    </Sheet>
  );
}