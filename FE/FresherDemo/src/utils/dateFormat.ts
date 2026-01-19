/**
 * Date Formatting Utilities
 * Provides centralized date/time formatting functions for consistent display across the application.
 * Created By: DatND (15/1/2026)
 */

/**
 * Format date string or Date object to DD/MM/YYYY format.
 * Returns empty string for null/undefined, original string for invalid dates.
 * Created By: DatND (15/1/2026)
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';

  const date = new Date(dateInput);

  // Check if date is valid
  if (isNaN(date.getTime())) return String(dateInput);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format date to YYYY-MM-DD format (ISO date string). Useful for date input values and API communications.
 * Returns empty string for null/undefined or invalid dates.
 * Created By: DatND (15/1/2026)
 */
export function formatDateISO(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Format a date to a readable Vietnamese format with full month name
 * 
 * @param {string|Date|null} dateInput - Date string, Date object, or null
 * @returns {string} Formatted date string (DD Tháng MM, YYYY) or empty string
 * 
 * @example
 * formatDdate to readable Vietnamese format (DD Tháng MM, YYYY).
 * Returns empty string for null/undefined, original string for invalid dates.
 * Created By: DatND (15/1/2026)
  if (isNaN(date.getTime())) return String(dateInput);

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${day} Tháng ${month}, ${year}`;
}

/**
 * Parse DD/MM/YYYY format string to Date object
 * 
 * @param {string} dateString - Date string in DD/MM/YYYY format
 * @returns {Date|null} Date object or null if invalid
 * .
 * Returns null for null/undefined or invalid date strings.
 * Created By: DatND (15/1/2026)
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0]!, 10);
  const month = parseInt(parts[1]!, 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2]!, 10);

  const date = new Date(year, month, day);
  
  // Validate the date
  if (isNaN(date.getTime())) return null;
  
  return date;
}

/**
 * Check if a date string is valid
 * 
 * @param {string|Date} dateInput - Date to validate
 * @returns {boolean} True if valid date, false otherwise
 * date string or Date object is valid.
 * Returns true if valid date, false for null/undefined or invalid dates.
 * Created By: DatND (15/1/2026)
  const date = new Date(dateInput);
  return !isNaN(date.getTime());
}

/**
 * Get today's date in YYYY-MM-DD format
 * 
 * @returns {string} Today's date as ISO string
 * 
 * @example
 * getTodayISO() // Returns: '2024-12-17'
 */
export function getTodayISO(): string {
  return formatDateISO(new Date());
}
/**
 * Format time string or Date object to HH:mm format for HTML time inputs.
 * Returns empty string for null/undefined, handles both string (HH:mm:ss) and Date inputs.
 * Created By: DatND (15/1/2026)
 */
export function formatTime(timeInput: string | Date | null | undefined): string {
  if (!timeInput) return '';

  // If it's already a string in HH:mm or HH:mm:ss format, extract HH:mm
  if (typeof timeInput === 'string') {
    return timeInput.substring(0, 5);
  }

  // If it's a Date object, format to HH:mm
  const date = new Date(timeInput);
  if (isNaN(date.getTime())) return '';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function formatTimeLocal(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function timeToDate(time: string): Date {
  const [h, m, s] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h ?? 0, m ?? 0, s ?? 0, 0);
  return date;
}
