// src/components/ui/time-select.tsx
import React, { useRef, useState } from 'react';
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { formatTime, convertTo24Hour } from '@/lib/utils/date-utils';
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface TimeSelectProps {
  value?: string;        // Make value optional
  onChange: (time: string) => void;
  className?: string;
}

function convertTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  let hours12 = hours % 12;
  hours12 = hours12 === 0 ? 12 : hours12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function TimeSelect({ 
  value = '', // Provide default empty string
  onChange, 
  className
}: TimeSelectProps) {
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Generate all times (24 hours in 30 min increments)
  const allTimes = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  // Get current visible window of times
  const visibleTimes = allTimes.slice(startIndex, startIndex + 6);

  const handleScroll = (direction: 'up' | 'down') => {
    setStartIndex(current => {
      if (direction === 'up') {
        if (current === 0) return allTimes.length - 6;
        return Math.max(0, current - 1);
      } else {
        if (current >= allTimes.length - 6) return 0;
        return Math.min(allTimes.length - 6, current + 1);
      }
    });
  };

  // Handle wheel events
  const handleWheel = (e: React.WheelEvent) => {
    handleScroll(e.deltaY > 0 ? 'down' : 'up');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            open && "ring-2 ring-primary border-transparent",
            className
          )}
        >
          <Button>
  <Clock className="mr-2 h-4 w-4" />
  {value ? formatTime(value) : 'Select time'}
</Button>
          {value ? convertTo12Hour(value) : 'Select time'}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-[200px] p-0",
          "ring-2 ring-primary border-0"
        )} 
        align="start"
      >
        <div className="flex flex-col">
          <Button
            variant="ghost"
            className="h-8 flex items-center justify-center hover:bg-accent"
            onClick={() => handleScroll('up')}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          
          <div
            ref={listRef}
            className="overflow-hidden"
            onWheel={handleWheel}
          >
            {visibleTimes.map((time) => (
              <div
                key={time}
                className={cn(
                  "px-4 py-2 cursor-pointer transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  time === value && "bg-primary text-primary-foreground"
                )}
                onClick={() => {
                  onChange(time);
                  setOpen(false);
                }}
              >
                {convertTo12Hour(time)}
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            className="h-8 flex items-center justify-center hover:bg-accent"
            onClick={() => handleScroll('down')}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}