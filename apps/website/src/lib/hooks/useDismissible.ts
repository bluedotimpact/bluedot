import { useEffect, useRef } from 'react';
import { useClickOutside } from './useClickOutside';

/**
 * Click-outside and Escape dismissal for a menu. Escape also returns focus to the trigger.
 */
export function useDismissible<Container extends HTMLElement = HTMLDivElement>(onClose: () => void, enabled = true) {
  const containerRef = useClickOutside<Container>(onClose, enabled);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onClose]);

  return { containerRef, triggerRef };
}
