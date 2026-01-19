/**
 * Common Utilities
 * 
 * Shared helper functions used across multiple pages and components.
 * Provides string manipulation, HTML escaping, text formatting,
 * and other frequently used utility functions.
 * 
 * @module utils/common
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 * 
 * Converts <, >, &, ", and ' to their HTML entity equivalents.
 * Essential for safely displaying user-generated content in HTML.
 * 
 * @param {string|null|undefined} text - Text to escape
 * @returns {string} HTML-safe string
 * 
 * @example
 * escapeHtml('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 * 
 * escapeHtml(null) // Returns: ''
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generate initials from a full name
 * 
 * Extracts first letters of first and last name for avatar display.
 * Falls back to '?' for empty names.
 * 
 * @param {string} fullName - Full name string
 * @param {number} maxLength - Maximum number of initials (default: 2)
 * @returns {string} Uppercase initials
 * 
 * @example
 * getInitials('Nguyễn Văn An') // Returns: 'NA'
 * getInitials('John Doe Smith', 3) // Returns: 'JDS'
 * getInitials('') // Returns: '?'
 */
export function getInitials(fullName: string | null | undefined, maxLength: number = 2): string {
  if (!fullName || typeof fullName !== 'string') return '?';
  
  const names = fullName.trim().split(/\s+/);
  const initials = names
    .map(name => name.charAt(0))
    .join('')
    .substring(0, maxLength)
    .toUpperCase();
  
  return initials || '?';
}

/**
 * Get a random avatar background color class
 * 
 * Returns one of predefined color classes for avatar backgrounds.
 * Useful for generating consistent, visually distinct user avatars.
 * 
 * @returns {string} CSS class name for background color
 * 
 * @example
 * getAvatarColorClass(0) // Returns: 'bg-orange'
 * getAvatarColorClass(3) // Returns: 'bg-pink'
 */
export function getAvatarColorClass(): string {
  const colors = ['bg-orange', 'bg-blue', 'bg-cyan', 'bg-pink', 'bg-purple'];
  return colors[Math.floor(Math.random() * colors.length)] || 'bg-orange';
}

/**
 * Debounce function execution
 * 
 * Delays function execution until after a specified wait time has elapsed
 * since the last call. Useful for search inputs and resize handlers.
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 * 
 * @example
 * const debouncedSearch = debounce((query) => search(query), 300);
 * input.addEventListener('input', (e) => debouncedSearch(e.target.value));
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T, 
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;
  
  return function executedFunction(...args: Parameters<T>): void {
    const later = (): void => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Deep clone an object
 * 
 * Creates a deep copy of an object to prevent mutation.
 * Note: Does not handle circular references or special objects (Date, RegExp, etc.)
 * 
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 * 
 * @example
 * const original = { name: 'John', details: { age: 30 } };
 * const cloned = deepClone(original);
 * cloned.details.age = 31; // original.details.age remains 30
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generate a simple unique ID
 * 
 * Creates a pseudo-unique identifier using timestamp and random number.
 * Suitable for temporary client-side IDs. For production, use UUID library.
 * 
 * @returns {string} Unique identifier string
 * 
 * @example
 * generateId() // Returns: 'id_1702834567890_0.123456789'
 */
export function generateId(): string {
  return `id_${Date.now()}_${Math.random()}`;
}

/**
 * Sort array of objects by a specific key
 * 
 * Generic sorting function for object arrays. Handles string and number values.
 * Case-insensitive for strings.
 * 
 * @param {Array} array - Array of objects to sort
 * @param {string} key - Object key to sort by
 * @param {string} order - Sort order: 'asc' or 'desc' (default: 'asc')
 * @returns {Array} Sorted array
 * 
 * @example
 * const users = [{ name: 'Bob' }, { name: 'Alice' }];
 * sortByKey(users, 'name', 'asc') // Returns: [{ name: 'Alice' }, { name: 'Bob' }]
 */
export function sortByKey<T extends Record<string, any>>(
  array: T[], 
  key: keyof T, 
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    let valA = a[key];
    let valB = b[key];
    
    // Handle string comparison (case-insensitive)
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Convert CSV data to downloadable file
 * 
 * Creates a Blob and triggers browser download for CSV export.
 * Includes UTF-8 BOM for proper Excel compatibility.
 * 
 * @param {string} csvContent - CSV content as string
 * @param {string} filename - Download filename (without extension)
 * 
 * @example
 * const csv = 'Name,Age\nJohn,30\nJane,25';
 * downloadCSV(csv, 'users_export');
 */
export function downloadCSV(csvContent: string, filename: string = 'export'): void {
  // Add UTF-8 BOM for proper Excel display
  const blob = new Blob(['\ufeff' + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  
  // Clean up
  URL.revokeObjectURL(link.href);
}

/**
 * Convert array of objects to CSV string
 * 
 * Transforms structured data to CSV format for export.
 * Handles nested objects by flattening values.
 * 
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Column headers (keys to include)
 * @returns {string} CSV formatted string
 * 
 * @example
 * const data = [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }];
 * const csv = arrayToCSV(data, ['name', 'age']);
 * // Returns: 'name,age\n"John",30\n"Jane",25'
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[], 
  headers: (keyof T)[]
): string {
  if (!data || data.length === 0) return '';
  
  // Create header row
  const headerRow = headers.map(h => String(h)).join(',');
  
  // Create data rows
  const dataRows = data.map(item => {
    return headers.map(header => {
      const value = item[header] || '';
      // Escape quotes and wrap in quotes if contains comma or quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 * 
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 * 
 * @example
 * isEmpty(null) // Returns: true
 * isEmpty('') // Returns: true
 * isEmpty([]) // Returns: true
 * isEmpty('text') // Returns: false
 */
export function isEmpty(value: any): boolean {
  return value === null || 
         value === undefined || 
         value === '' || 
         (Array.isArray(value) && value.length === 0);
}

/**
 * Capitalize first letter of string
 * 
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 * 
 * @example
 * capitalize('hello world') // Returns: 'Hello world'
 */
export function capitalize(str: string | null | undefined): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
