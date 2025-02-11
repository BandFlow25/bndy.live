import { Button } from "@/components/ui/button";// src/components/Sidebar.tsx
import { useState, useCallback } from 'react';
import { Gig, GigFilters, LocationFilter } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Tag } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { GENRES } from "@/lib/constants";

interface SidebarProps {
  gigs: Gig[];
  filters: GigFilters;
  locationFilter?: LocationFilter;
  onFilterChange: (filters: GigFilters) => void;
  onLocationFilterChange?: (locationFilter: LocationFilter) => void;
  onGigSelect: (gig: Gig | null) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({ gigs, filters, onFilterChange, onGigSelect, isOpen, onOpenChange }: SidebarProps) {
  const [searchRadius, setSearchRadius] = useState(10); // Default 10 mile radius

  const handleInputChange = useCallback((key: keyof GigFilters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  }, [filters, onFilterChange]);

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="relative">
        <Input
          placeholder="Search bands or venues..."
          value={filters.searchTerm}
          onChange={(e) => handleInputChange('searchTerm', e.target.value)}
          className="w-full bg-background border border-muted rounded-[30px] ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6B00] px-4"
        />
      </div>
      
      <Select
        value={filters.dateFilter}
        onValueChange={(value: 'all' | 'today' | 'week' | 'month') => 
          handleInputChange('dateFilter', value)}
      >
        <SelectTrigger className="w-full bg-background border border-muted rounded-[30px] ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6B00]">
          <SelectValue placeholder="All Dates" />
        </SelectTrigger>
        <SelectContent className="bg-[#1a1f2d] border border-muted rounded-[20px] overflow-hidden">
          <SelectGroup>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="space-y-2">
        <Input
          placeholder="Enter postcode..."
          value={filters.postcode || ''}
          onChange={(e) => handleInputChange('postcode', e.target.value)}
          className="w-full bg-background border border-muted rounded-[30px] ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6B00] px-4"
        />
        <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
          <span>Search radius:</span>
          <select
            value={searchRadius}
            onChange={(e) => {
              const newRadius = Number(e.target.value);
              setSearchRadius(newRadius);
              // Don't try to update filters with searchRadius
            }}
            className="bg-background border-none focus:ring-0 rounded-md"
          >
            <option value={5}>5 miles</option>
            <option value={10}>10 miles</option>
            <option value={25}>25 miles</option>
            <option value={50}>50 miles</option>
          </select>
        </div>
      </div>

      <Select
        value={filters.genre || ""}
        onValueChange={(value) => handleInputChange('genre', value)}
      >
        <SelectTrigger className="w-full bg-background border border-muted rounded-[30px] ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6B00]">
          <SelectValue placeholder="All Genres" />
        </SelectTrigger>
        <SelectContent className="bg-[#1a1f2d] border border-muted rounded-[20px] overflow-hidden">
          <SelectGroup>
            {GENRES.map((genre: string) => (
              <SelectItem 
                key={genre} 
                value={genre}
                className="focus:bg-blue-500 focus:text-white data-[highlighted]:bg-blue-500 data-[highlighted]:text-white"
              >
                {genre}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={filters.ticketType}
        onValueChange={(value: "all" | "free" | "paid") => 
          handleInputChange('ticketType', value)}
      >
        <SelectTrigger className="w-full bg-background border border-muted rounded-[30px] ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6B00]">
          <SelectValue placeholder="All Events" />
        </SelectTrigger>
        <SelectContent className="bg-[#1a1f2d] border border-muted rounded-[20px] overflow-hidden">
          <SelectGroup>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="free">Free Entry</SelectItem>
            <SelectItem value="paid">Ticketed</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );

  // Desktop sidebar
  const DesktopSidebar = () => (
    <div className="hidden lg:block fixed top-[4.5rem] left-4 bottom-4 w-[300px] bg-card/95 backdrop-blur-sm rounded-lg border p-4">
      <FilterContent />
    </div>
  );

  return (
    <>
      <DesktopSidebar />
      
      {/* Filter Button */}
      <Button
        className="fixed bottom-4 left-4 z-10 bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3"
        onClick={() => onOpenChange(true)}
      >
        <Tag className="w-4 h-4 mr-2" />
        Filters
      </Button>

      {/* Filter Sheet */}
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent 
          side="left" 
          className="w-[300px] sm:w-[400px] bg-background border-r border-border p-6"
        >
          <SheetTitle>Search Gigs</SheetTitle>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}