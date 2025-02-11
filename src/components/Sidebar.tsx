import { Button } from "@/components/ui/button";
import { useState, useCallback } from 'react';
import { Gig, GigFilters, LocationFilter } from "@/lib/types";
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
import { SheetTitle } from "@/components/ui/sheet";
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

export function Sidebar({ gigs, filters, onFilterChange, isOpen, onOpenChange }: SidebarProps) {
  const [searchRadius, setSearchRadius] = useState(10);

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
          className="form-input"
        />
      </div>

      <Select value={filters.dateFilter} onValueChange={(value) => handleInputChange('dateFilter', value)}>
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
        value={filters.postcode || ''}
        onChange={(e) => handleInputChange('postcode', e.target.value)}
        className="form-input"
      />

      <Select value={filters.genre || ""} onValueChange={(value) => handleInputChange('genre', value)}>
        <SelectTrigger className="form-select">
          <SelectValue placeholder="All Genres" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {GENRES.map((genre) => (
              <SelectItem key={genre} value={genre} className="gig-list-item">
                {genre}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select value={filters.ticketType} onValueChange={(value) => handleInputChange('ticketType', value)}>
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
    </div>
  );

  return (
    <>
      {/* Sidebar Panel */}
      <div className={`side-panel side-panel-left ${isOpen ? "side-panel-open" : ""}`}>
        <div className="w-[300px] sm:w-[400px] bg-background border-border p-6 shadow-lg">
          <SheetTitle>Search Gigs</SheetTitle>
          <div className="mt-6">
            <FilterContent />
          </div>
        </div>
      </div>

      {/* Floating Filter Button */}
      <Button className="fixed bottom-4 left-4 z-10 bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3"
        onClick={() => onOpenChange(true)}>
        <Tag className="w-4 h-4 mr-2" />
        Filters
      </Button>
    </>
  );
}
