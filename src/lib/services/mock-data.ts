// src/lib/services/mock-data.ts
import * as XLSX from 'xlsx';
import { Gig } from '@/lib/types';

function formatTime(timeStr: string | undefined): string {
  if (!timeStr) return "20:00";
  return timeStr.replace(/\//g, ' - ').trim();
}

interface ExcelRow {
  [key: string]: string | number | Date;
}

export async function loadMockGigs(): Promise<Gig[]> {
  const uniqueVenues = new Set<string>();
  const validGigs: Gig[] = [];

  try {
    console.log("Starting to load gigs...");
    const response = await fetch('/data/gigs.xlsx');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    const workbook = XLSX.read(data, {
      type: 'array',
      cellDates: true,
      cellNF: true,
      cellStyles: true,
      dateNF: 'yyyy-mm-dd'
    });

    console.log("Available sheets:", workbook.SheetNames);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

    console.log("Total rows found:", rawData.length);
    console.log("Sample row:", rawData[0]);

    for (const [index, row] of rawData.entries()) {
      try {
        if (!row || Object.keys(row).length <= 2) {
          console.log(`Skipping row ${index}: insufficient data`);
          continue;
        }

        const keys = Object.keys(row);
        
        if (index === 0) {
          console.log("Column headers:", keys);
        }

        const dateKey = keys.find(key => key.includes("2025") || key.includes("date") || key.includes("Date"));
        const bandKey = keys.find(key => key.includes("band") || key.includes("Band") || key.includes("Bootleg"));
        const venueKey = keys.find(key => key.includes("venue") || key.includes("Venue") || key.includes("Bridge"));
        const timeKey = keys.find(key => key.includes("pm") || key.includes("am") || key.includes("time") || key.includes("Time"));

        if (!dateKey || !bandKey || !venueKey) {
          console.log(`Skipping row ${index} due to missing fields:`, { dateKey, bandKey, venueKey, keys });
          continue;
        }

        const date = row[dateKey] instanceof Date 
          ? row[dateKey] as Date
          : new Date(row[dateKey].toString());

        const venue = row[venueKey].toString();
        uniqueVenues.add(venue);

        // Create a deterministic but spread out location for each venue
        const hash = venue.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const location = {
          lat: 53.002668 + (hash % 100) / 1000,
          lng: -2.179404 + (hash % 100) / 1000
        };

        validGigs.push({
          id: `gig-${index}`,
          bandName: row[bandKey].toString(),
          venueName: venue,
          date: date.toISOString().split('T')[0],
          time: timeKey ? formatTime(row[timeKey].toString()) : "20:00",
          location,
          venueAddress: venue,
          status: 'approved',
          createdAt: new Date().toISOString(),
          type: 'gig'
        });

        if (index % 50 === 0) {
          console.log(`Sample gig at index ${index}:`, validGigs[validGigs.length - 1]);
        }
      } catch (error) {
        console.log(`Error processing row ${index}:`, error);
      }
    }

    console.log("Unique venues found:", Array.from(uniqueVenues).sort());
    console.log(`Total unique venues: ${uniqueVenues.size}`);
    console.log(`Successfully processed ${validGigs.length} gigs out of ${rawData.length} rows`);
    return validGigs;
  } catch (error) {
    console.error("Error loading gigs from Excel:", error);
    return [];
  }
}

export function filterGigs(gigs: Gig[], filters: {
  searchTerm?: string;
  genre?: string;
  postcode?: string;
  dateFilter?: 'all' | 'today' | 'week' | 'month';
}): Gig[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1); // Set to Monday of current week
  monday.setHours(0, 0, 0, 0);

  const filtered = gigs.filter(gig => {
    const gigDate = new Date(gig.date);
    const matchesSearch = !filters.searchTerm || 
      gig.bandName.toLowerCase().includes((filters.searchTerm || '').toLowerCase()) ||
      gig.venueName.toLowerCase().includes((filters.searchTerm || '').toLowerCase());
      
    const matchesGenre = !filters.genre || gig.genre === filters.genre;
    
    const matchesPostcode = !filters.postcode || 
      gig.venueAddress.toLowerCase().includes((filters.postcode || '').toLowerCase());

    let matchesDate = true;
    if (filters.dateFilter) {
      switch (filters.dateFilter) {
        case 'today':
          matchesDate = gigDate.toDateString() === now.toDateString();
          break;
        case 'week':
          matchesDate = gigDate >= monday;
          break;
        case 'month':
          matchesDate = gigDate.getMonth() === now.getMonth() && 
                       gigDate.getFullYear() === now.getFullYear();
          break;
        // 'all' will keep matchesDate as true
      }
    }
    
    return matchesSearch && matchesGenre && matchesPostcode && matchesDate;
  });

  console.log(`Filtered from ${gigs.length} to ${filtered.length} gigs`);
  return filtered;
}