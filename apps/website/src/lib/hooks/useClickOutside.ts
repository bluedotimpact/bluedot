import { useEffect, useRef, type RefObject } from 'react';

/**
 * Hook to detect clicks outside of a referenced element.
 * Useful for closing dropdowns, modals, and popups.
 *
 * @param onClickOutside - Callback to invoke when clicking outside
 * @param enabled - Whether the hook is active
 * @param exclusionSelector - Optional CSS selector for the container element.
 *                            Uses Element.closest() to check if click is inside this selector.
 *                            Recommended for absolutely-positioned elements where ref.contains()
 *                            may not accurately reflect the visual DOM hierarchy.
 */
export function useClickOutside<T extends HTMLElement = HTMLDivElement>(
  onClickOutside: () => void,
  enabled = true,
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

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

  return ref;
}
