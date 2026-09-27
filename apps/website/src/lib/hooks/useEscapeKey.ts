import { useEffect } from 'react';

/**
 * Calls `onEscape` when Escape is pressed anywhere in the document while `enabled`.
 * Pair with useClickOutside for dismissible menus and drawers.
 */
export function useEscapeKey(onEscape: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onEscape]);
}
