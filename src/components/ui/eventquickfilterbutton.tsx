import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

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
      const nextFridayOffset = (5 - now.getDay() + 7) % 7;
      startDate.setDate(now.getDate() + nextFridayOffset);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 2);
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

  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    const { startDate, endDate } = getDateRangeForFilter(filter);
    onFilterChange(startDate, endDate);
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-center">
      {isExpanded && (
        <div className="flex flex-col space-y-1 mb-1 transition-all duration-300">
          {filters.filter(f => f.value !== selectedFilter).map(filter => (
            <Button
              key={filter.value}
              variant={selectedFilter === filter.value ? "default" : "outline"}
              className="w-full px-4 py-2 rounded-md shadow-md"
              onClick={() => handleFilterSelect(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      )}

      <Button 
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 py-3 shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Filter className="w-4 h-4 mr-2" />
        {filters.find(f => f.value === selectedFilter)?.label || "Filters"}
      </Button>
    </div>
  );
}
