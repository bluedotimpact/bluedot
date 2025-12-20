import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook to detect clicks outside of a referenced element.
 * Useful for closing dropdowns, modals, and popups.
 */
export function useClickOutside<T extends HTMLElement = HTMLDivElement>(
  onClickOutside: () => void,
  enabled = true,
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [enabled, onClickOutside]);

  return ref as RefObject<T>;
}
