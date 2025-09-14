
import { differenceInYears, differenceInMonths, differenceInDays, parseISO, isValid, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Parse a date string into a Date object, handling different date formats
 */
export const parseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  // Try parsing as ISO date first
  if (dateString.includes('T')) {
    return parseISO(dateString);
  }
  
  // Brazilian format: DD/MM/YYYY
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      // Check if parts are valid numbers
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month - 1, day); // Month is 0-indexed
        // Validate that we have a proper date with the intended values
        if (
          date.getFullYear() === year &&
          date.getMonth() === month - 1 &&
          date.getDate() === day &&
          isValid(date)
        ) {
          return date;
        }
      }
    }
  }
  
  // Try as standard date string
  const date = new Date(dateString);
  return isValid(date) ? date : null;
};

/**
 * Format a date for display in Brazilian format: DD/MM/YYYY
 */
export const formatDate = (date: Date | string | null): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj) return '';
  
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
};

/**
 * Format a date for saving to the database in ISO format: YYYY-MM-DD
 */
export const formatDateForDB = (date: Date | string | null): string | null => {
  if (!date) return null;
  
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj) return null;
  
  return format(dateObj, 'yyyy-MM-dd');
};

/**
 * Calculate detailed age from date of birth
 * Returns age in years, months, or days depending on the age
 */
export const calculateDetailedAge = (dateOfBirth: Date | string | null): string => {
  if (!dateOfBirth) return '';
  
  // Parse the date if it's a string
  const birthDate = typeof dateOfBirth === 'string' ? parseDate(dateOfBirth) : dateOfBirth;
  
  // If parsing failed, return empty string
  if (!birthDate) return '';
  
  const today = new Date();
  
  // Calculate years
  const years = differenceInYears(today, birthDate);
  
  if (years > 0) {
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  }
  
  // Calculate months if less than 1 year
  const months = differenceInMonths(today, birthDate);
  
  if (months > 0) {
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }
  
  // Calculate days if less than 1 month
  const days = differenceInDays(today, birthDate);
  return `${days} ${days === 1 ? 'dia' : 'dias'}`;
};

/**
 * Calculate numeric age in years from date of birth
 */
export const calculateAgeInYears = (dateOfBirth: Date | string | null): number => {
  if (!dateOfBirth) return 0;
  
  // Parse the date if it's a string
  const birthDate = typeof dateOfBirth === 'string' ? parseDate(dateOfBirth) : dateOfBirth;
  
  // If parsing failed, return 0
  if (!birthDate) return 0;
  
  return differenceInYears(new Date(), birthDate);
};
