// src/components/Sidebar.tsx
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { Event } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Tag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface EventFilters {
  searchTerm: string;
  ticketType: 'all' | 'free' | 'paid';
  dateFilter: 'all' | 'today' | 'week' | 'month';
  postcode?: string;
}

interface SidebarProps {
  events: Event[];
  filters: EventFilters;
  onFilterChange: (filters: EventFilters) => void;
  onEventSelect: (event: Event | null) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({
  events,
  filters,
  onFilterChange,
  onEventSelect,
  isOpen,
  onOpenChange
}: SidebarProps) {
  const handleInputChange = useCallback(
    (key: keyof EventFilters, value: string) => {
      onFilterChange({ ...filters, [key]: value });
    },
    [filters, onFilterChange]
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (timeStr: string) => {
    return timeStr;  // Add any time formatting logic if needed
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-4 left-4 z-10 bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3">
          <Tag className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </SheetTrigger>

      <SheetContent 
  side="left" 
  className="w-[400px] sm:w-[540px] bg-background/95 backdrop-blur-sm safari-modal"
>
        <SheetTitle>Find Events</SheetTitle>
        <div className="mt-6 space-y-6">
          <div className="relative">
            <Input
              placeholder="Search events..."
              value={filters.searchTerm}
              onChange={(e) => handleInputChange("searchTerm", e.target.value)}
              className="form-input"
            />
          </div>

          <Select
            value={filters.dateFilter}
            onValueChange={(value) => handleInputChange("dateFilter", value)}
          >
            <SelectTrigger className="form-select">
              <SelectValue placeholder="All Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Input
            placeholder="Enter postcode..."
            value={filters.postcode || ""}
            onChange={(e) => handleInputChange("postcode", e.target.value)}
            className="form-input"
          />

          <Select
            value={filters.ticketType}
            onValueChange={(value) => handleInputChange("ticketType", value)}
          >
            <SelectTrigger className="form-select">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="free">Free Entry</SelectItem>
                <SelectItem value="paid">Ticketed</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Event List */}
          <div className="mt-6">
            <h3 className="font-semibold mb-4">
              Found {events.length} event{events.length !== 1 ? 's' : ''}
            </h3>
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 bg-card rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => onEventSelect(event)}
                >
                  <h4 className="font-medium">{event.name}</h4>
                  <p className="text-sm text-muted-foreground">{event.venueName}</p>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {formatDate(event.date)} at {formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </div>
                  {event.ticketPrice && (
                    <div className="mt-1 text-sm">
                      {event.ticketPrice === 'FREE' ? (
                        <span className="text-green-500">Free Entry</span>
                      ) : (
                        <span>Tickets: {event.ticketPrice}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}