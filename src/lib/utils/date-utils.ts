// src/lib/utils/date-utils.ts

/**
 * Gets the ordinal suffix for a number (1st, 2nd, 3rd, etc)
 */
export function getOrdinalSuffix(day: number): string {
    if (day >= 11 && day <= 13) {
      return 'th';
    }
    
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
  
/**
 * Formats a date with ordinal day (e.g., "Sat 22nd Feb") and identifies Today/Tomorrow.
 */
export function formatEventDate(date: Date): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize current date to midnight for comparison

  const eventDate = new Date(date);
  eventDate.setHours(0, 0, 0, 0); // Normalize event date

  const day = eventDate.getDate();
  const month = eventDate.toLocaleString('default', { month: 'short' });
  const weekday = eventDate.toLocaleString('default', { weekday: 'short' });

  const timeDiff = eventDate.getTime() - now.getTime();
  const dayDiff = timeDiff / (1000 * 60 * 60 * 24);

  if (dayDiff === 0) {
    return `Today`;
  } else if (dayDiff === 1) {
    return `Tomorrow`;
  }

  return `${weekday} ${day}${getOrdinalSuffix(day)} ${month}`;
}
  
  /**
   * Converts 24-hour time to 12-hour format with AM/PM
   */
  export function formatTime(time24: string): string {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    let hours12 = hours % 12;
    hours12 = hours12 === 0 ? 12 : hours12;
    return `${hours12}:${minutes.toString().padStart(2, '0')}${period}`;
  }
  
  /**
   * Formats a full event datetime (e.g., "Sat 22nd Feb @ 7:00PM")
   */
  export function formatEventDateTime(date: Date, time24: string): string {
    return `${formatEventDate(date)} @ ${formatTime(time24)}`;
  }
  
  /**
   * Converts time from 12-hour format to 24-hour format
   */
  export function convertTo24Hour(time12: string): string {
    const [time, period] = time12.split(/\s*(AM|PM)/i);
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  /**
   * Add hours to a time in 24-hour format
   */
  export function addHoursTo24HourTime(time24: string, hoursToAdd: number): string {
    const [hours, minutes] = time24.split(':').map(Number);
    const newHours = (hours + hoursToAdd) % 24;
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  /**
   * Parse date string safely
   */
  export function parseEventDate(dateStr: string): Date | null {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }