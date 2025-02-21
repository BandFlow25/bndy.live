import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchArtists } from '@/lib/services/artist-service'
import { getArtistById } from "@/lib/services/artist-service";

const validPostcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?$/i; // UK Outward Code regex

export function FiltersSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [postcode, setPostcode] = useState("");
  const [showOpenMic, setShowOpenMic] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [ticketType, setTicketType] = useState("all");
  const [showFavourites, setShowFavourites] = useState(false);
  const [postcodeError, setPostcodeError] = useState("");
  const [artistQuery, setArtistQuery] = useState("");
const [artistResults, setArtistResults] = useState<{ id: string; name: string }[]>([]);
const [autoCompleteText, setAutoCompleteText] = useState(""); // New state for inline autocomplete



  const applyFilters = () => {
    console.log("Filters Applied:", {
      selectedArtists,
      postcode,
      showOpenMic,
      selectedGenres,
      ticketType,
      showFavourites,
    });
    onClose();
  };

  const validatePostcode = (value: string) => {
    const trimmedValue = value.toUpperCase().trim();
    setPostcode(trimmedValue);
    if (!validPostcodeRegex.test(trimmedValue)) {
      setPostcodeError("Invalid UK postcode outward code.");
    } else {
      setPostcodeError("");
    }
  };

  const handleArtistSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setArtistQuery(value);

    if (value.length < 2) {
        setArtistResults([]);
        setAutoCompleteText("");
        return;
    }

    const results = await searchArtists(value); // Fetch matching artists from DB
    setArtistResults(results);

    // If we have results, suggest the first match for inline autocomplete
    if (results.length > 0) {
        setAutoCompleteText(results[0].name);
    } else {
        setAutoCompleteText("");
    }
};

  // Handle arrow key navigation
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Tab" || event.key === "Enter") {
        event.preventDefault();
        if (autoCompleteText) {
            setArtistQuery(autoCompleteText); // Set full match
            setAutoCompleteText("");
            setArtistResults([]); // Hide suggestions
        }
    }
};

  // const selectArtist = (name: string) => {
  //   setArtistSearch(name); // Auto-fill input field
  //   setArtistResults([]); // Hide suggestions
  // };

  return (
    <div className={`fixed left-0 top-0 w-72 h-full bg-background p-5 shadow-lg transition-transform ${isOpen ? "side-panel-open" : "side-panel-left"} side-panel`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Advanced Filters</h2>
        <button onClick={onClose} className="text-xl">
          <X />
        </button>
      </div>

      {/* Postcode Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Search by Postcode (Outward Code)</label>
        <input
          type="text"
          value={postcode}
          onChange={(e) => validatePostcode(e.target.value)}
          className={`form-input mt-1 w-full ${postcodeError ? "border-red-500" : ""}`}
          placeholder="E.g., M1, SW1A"
        />
        {postcodeError && <p className="text-red-500 text-xs mt-1">{postcodeError}</p>}
      </div>

      {/* Artist Search Field */}
      <div className="relative">
        <label className="block text-sm font-medium">Search by Artist</label>
        <div className="relative">
            {/* User Input Field */}
            <input
                type="text"
                value={artistQuery}
                onChange={handleArtistSearch}
                onKeyDown={handleKeyDown}
                placeholder="Search for an artist..."
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-md px-4 py-2"
            />

            {/* Autocomplete Overlay */}
            {autoCompleteText && autoCompleteText.toLowerCase().startsWith(artistQuery.toLowerCase()) && (
                <input
                    type="text"
                    value={autoCompleteText}
                    disabled
                    className="absolute top-0 left-0 w-full bg-transparent text-gray-400 px-4 py-2 pointer-events-none"
                />
            )}
        </div>
    </div>


      {/* Open Mic Events */}
      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={showOpenMic} onChange={() => setShowOpenMic(!showOpenMic)} />
          <span>Show Open Mic Events</span>
        </label>
      </div>

      {/* Genre Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Filter by Genre</label>
        <select className="form-select mt-1">
          <option value="">All Genres</option>
          <option value="rock">Rock</option>
          <option value="jazz">Jazz</option>
          <option value="pop">Pop</option>
        </select>
      </div>

      {/* Ticket Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Show All / Free / Ticketed Events</label>
        <select className="form-select mt-1" value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
          <option value="all">All Events</option>
          <option value="free">Free Events</option>
          <option value="paid">Ticketed Events</option>
        </select>
      </div>

      {/* Show My Favourites */}
      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={showFavourites} onChange={() => setShowFavourites(!showFavourites)} />
          <span>Show My Favourite Artists & Venues</span>
        </label>
      </div>

      {/* Apply Button */}
      <Button className="w-full mt-4 bg-primary" onClick={applyFilters}>
        Apply Filters
      </Button>
    </div>
  );
}
