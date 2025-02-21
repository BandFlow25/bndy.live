import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { FiltersSidebar } from "@/components/filters/FiltersSidebar";

const filters = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "this_week" },
  { label: "This Weekend", value: "this_weekend" },
  { label: "Next Week", value: "next_week" },
  { label: "Next Weekend", value: "next_weekend" },
];

function getDateRangeForFilter(filter: string) {
  console.log(`Applying filter: ${filter}`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let startDate = new Date(now);
  let endDate = new Date(now);

  switch (filter) {
    case "today":
      startDate = new Date(now);
      endDate = new Date(now);
      break;
    case "this_weekend":
  const currentDay = now.getDay();
  if (currentDay >= 5) {
    // If today is Friday or later, start today
    startDate = new Date(now);
  } else {
    // Otherwise, start on the upcoming Friday
    startDate.setDate(now.getDate() + (5 - currentDay));
  }
  endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + (7 - startDate.getDay()));
  
  // Ensure full-day coverage
  endDate.setHours(23, 59, 59, 999);
  break;
    case "next_week":
      startDate.setDate(now.getDate() + (8 - now.getDay()) % 7);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      break;

      case "next_weekend":
        const today = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        let daysUntilNextFriday;
      
        if (today === 0) { // Today is Sunday
          daysUntilNextFriday = 5; // Next Friday is 5 days away
        } else if (today === 1) { // Monday
          daysUntilNextFriday = 11;
        } else if (today === 2) { // Tuesday
          daysUntilNextFriday = 10;
        } else if (today === 3) { // Wednesday
          daysUntilNextFriday = 9;
        } else if (today === 4) { // Thursday
          daysUntilNextFriday = 8;
        } else if (today === 5) { // Friday
          daysUntilNextFriday = 7;
        } else { // Saturday
          daysUntilNextFriday = 6;
        }
      
        startDate.setDate(now.getDate() + daysUntilNextFriday); // Next Friday
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 2); // Ends on Sunday
      
        // Ensure full-day coverage
        endDate.setHours(23, 59, 59, 999);
        break;
        case "this_week":
      if (now.getDay() === 0) {
        startDate = new Date(now);
        endDate = new Date(now);
      } else {
        startDate = new Date(now);
        endDate.setDate(now.getDate() + (7 - now.getDay()));
      }
      break;
  }
  
  console.log(`Start Date: ${startDate.toISOString()}`);
  console.log(`End Date: ${endDate.toISOString()}`);
  return { 
    startDate: startDate.toISOString().split("T")[0], // Extract YYYY-MM-DD only
    endDate: endDate.toISOString().split("T")[0] 
  };
}

interface FilterButtonProps {
  onFilterChange: (startDate: string, endDate: string) => void;
}

export function FilterButton({ onFilterChange }: FilterButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("this_week");
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  
  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    const { startDate, endDate } = getDateRangeForFilter(filter);
    onFilterChange(startDate, endDate);
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-center">
      {isExpanded && (
        <div className="flex flex-col space-y-2 mb-2 transition-all duration-300">
          {filters
            .filter(f => f.value !== selectedFilter)
            .map(filter => (
              <Button
                key={filter.value}
                variant="outline"
                className="w-full px-4 py-2 rounded-md shadow-md"
                onClick={() => handleFilterSelect(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          {/* More Filters Button */}
          {/* <Button
            className="w-full px-4 py-2 rounded-md shadow-md bg-primary text-white animate-pulse"
            onClick={() => setSidebarOpen(true)}
          >
            More Filters
          </Button> */}
        </div>
      )}

      <Button
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 py-3 shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Filter className="w-4 h-4 mr-2" />
        {filters.find(f => f.value === selectedFilter)?.label || "Filters"}
      </Button>

      {/* Sidebar Component */}
      <FiltersSidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
}