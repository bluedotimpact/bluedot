import { ProgressDots } from '@bluedot/ui';
import type { DynamicOptionsLoadingProps } from 'next/dynamic';

/**
 * `loading` fallback for `next/dynamic` modals, so the first open doesn't look like a dead click while the chunk
 * downloads. Matches the `Modal` overlay so the modal appears in place of the dots.
 */
export const ModalLoadingFallback = ({ error, pastDelay }: DynamicOptionsLoadingProps) => {
  // Skip the first 200ms (next/dynamic's default delay) to avoid a flash on fast connections, and give up on error
  // rather than leaving an overlay the user can't dismiss.
  if (Boolean(error) || !pastDelay) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-scrim backdrop-blur-xs">
      <ProgressDots className="my-0" />
    </div>
  );
};
