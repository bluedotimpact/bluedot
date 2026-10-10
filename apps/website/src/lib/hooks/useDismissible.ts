import { useEffect, useRef } from 'react';

/**
 * Click-outside and Escape dismissal for a menu. Escape also returns focus to the trigger when focus was inside.
 */
export function useDismissible<Container extends HTMLElement = HTMLDivElement>(onClose: () => void, enabled = true) {
  const containerRef = useRef<Container>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Callers pass fresh closures every render; reading through a ref keeps the listeners bound once per open
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const handleMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onCloseRef.current();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) {
        return;
      }

      const focusWasInside = containerRef.current?.contains(document.activeElement) ?? false;
      onCloseRef.current();
      if (focusWasInside) {
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);

  return { containerRef, triggerRef };
}
