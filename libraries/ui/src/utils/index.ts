import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

export const maybePlural = (count: number, base: string, pluralEnding = 's'): string => {
  return `${count} ${base}${count === 1 ? '' : pluralEnding}`;
};

/**
 * BlueDot uses custom font-size tokens named `text-size-{xxs..4xl}` instead of
 * Tailwind's defaults (`text-xs`, `text-sm`, …). Out of the box `tailwind-merge`
 * doesn't recognise these as font-size classes, so it groups them with
 * `text-{color}` and silently drops one when both appear in the same merge —
 * e.g. a `<CTALinkOrButton>` that sets `text-size-sm` via its size config and
 * `text-bluedot-navy` via `className` ends up with no font-size at all.
 *
 * Register the custom scale so font-size and text-color stay in distinct
 * conflict groups.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { 'text-size': ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] },
      ],
    },
  },
});

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
