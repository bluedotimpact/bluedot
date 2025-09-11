import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const maybePlural = (count: number, base: string, pluralEnding = 's'): string => {
  return `${count} ${base}${count === 1 ? '' : pluralEnding}`;
};

/**
 * Merges Tailwind CSS classes with proper conflict resolution. Later classes always take precedence over earlier ones.
 *
 * @example
 * ```ts
 * // Without cn:
 * clsx('rounded-sm', 'rounded-md') // No guarantee which class will be applied
 *
 * // With cn:
 * cn('rounded-sm', 'rounded-md') // Always 'rounded-md'
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
