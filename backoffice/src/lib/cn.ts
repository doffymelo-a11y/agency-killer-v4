import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge Tailwind CSS classes with proper precedence
 * Usage: cn('px-2 py-1', 'px-4') => 'py-1 px-4'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
