/**
 * UI utility functions
 *
 * @packageDocumentation
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS conflict resolution
 *
 * Combines clsx for conditional classes with tailwind-merge
 * for proper handling of Tailwind CSS class conflicts.
 *
 * @example
 * cn('px-4', 'px-2') // => 'px-2' (later value wins)
 * cn('text-red-500', isActive && 'text-blue-500')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with proper locale-specific formatting
 */
export function formatNumber(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format a date for display
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', options).format(d);
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate a color based on risk level
 */
export function getRiskColor(
  risk: 'high' | 'moderate' | 'low' | 'unknown'
): string {
  const colors = {
    high: 'text-red-600 bg-red-50',
    moderate: 'text-amber-600 bg-amber-50',
    low: 'text-green-600 bg-green-50',
    unknown: 'text-gray-500 bg-gray-50'
  };
  return colors[risk];
}

/**
 * Generate accessible color pair (text + background)
 */
export function getRiskColorPair(
  risk: 'high' | 'moderate' | 'low' | 'unknown'
): { text: string; bg: string; border: string } {
  const pairs = {
    high: {
      text: 'text-red-700',
      bg: 'bg-red-100',
      border: 'border-red-300'
    },
    moderate: {
      text: 'text-amber-700',
      bg: 'bg-amber-100',
      border: 'border-amber-300'
    },
    low: {
      text: 'text-green-700',
      bg: 'bg-green-100',
      border: 'border-green-300'
    },
    unknown: {
      text: 'text-gray-600',
      bg: 'bg-gray-100',
      border: 'border-gray-300'
    }
  };
  return pairs[risk];
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
