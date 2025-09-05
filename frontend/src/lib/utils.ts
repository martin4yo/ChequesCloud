import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  if (typeof date === 'string') {

    date = date.substring(0, 10);
    // For date-only strings (YYYY-MM-DD), parse without timezone conversion
    const [year, month, day] = date.split('-').map(Number);

console.log('Fecha', year, month, day)

    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(year, month - 1, day));
  }
  
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function dateStringToInputValue(dateString: string): string {
  // For YYYY-MM-DD strings from the backend, return as-is for input fields
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // For other date formats, convert to YYYY-MM-DD
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addOneDayToDate(dateString: string | null | undefined): string {
  // Add one day to a YYYY-MM-DD date string
  if (!dateString || typeof dateString !== 'string') {
    return '';
  }
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    date.setDate(date.getDate() + 1);
    
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newDay = String(date.getDate()).padStart(2, '0');
    return `${newYear}-${newMonth}-${newDay}`;
  }
  return dateString;
}

export function subtractOneDayFromDate(dateString: string): string {
  // Subtract one day from a YYYY-MM-DD date string
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - 1);
    
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newDay = String(date.getDate()).padStart(2, '0');
    return `${newYear}-${newMonth}-${newDay}`;
  }
  return dateString;
}

export function formatDatePlusOneDay(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  if (typeof date === 'string') {
    // Add one day before formatting
    const adjustedDate = addOneDayToDate(date);
    
    // If addOneDayToDate returns empty string, return '-'
    if (!adjustedDate) return '-';
    
    const [year, month, day] = adjustedDate.split('-').map(Number);
    
    // Additional validation
    if (!year || !month || !day) return '-';
    
    const dateObj = new Date(year, month - 1, day);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return '-';
    
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(dateObj);
  }
  
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}