import { useEffect, useRef, type RefObject } from 'react';

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
