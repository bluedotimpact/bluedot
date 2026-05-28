import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircledCheckmarkIcon } from './icons/CircledCheckmarkIcon';
import { CloseIcon } from './icons/CloseIcon';
import { TOAST_EXIT_DURATION_MS, useToastStore, type ToastEntry } from './toastStore';
import { cn } from './utils';

const TOAST_STYLES = `
@keyframes bd-toast-in-right {
  from { opacity: 0; transform: translateX(24px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes bd-toast-in-bottom {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes bd-toast-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
.bd-toast-enter-desktop { animation: bd-toast-in-right 200ms ease-out both; }
.bd-toast-enter-mobile { animation: bd-toast-in-bottom 200ms ease-out both; }
.bd-toast-exit { animation: bd-toast-out 150ms ease-in both; }
/* Reduced motion: drop the slide on enter, keep a plain fade. Exit already fades-only so it's unchanged. */
@media (prefers-reduced-motion: reduce) {
  .bd-toast-enter-desktop, .bd-toast-enter-mobile { animation: bd-toast-out 200ms ease-out reverse both; }
  .bd-toast-exit { animation: bd-toast-out 150ms ease-in both; }
}
`;

const ToastItem = ({ toast }: { toast: ToastEntry }) => {
  const paused = useToastStore((s) => s.paused);
  const startExit = useToastStore((s) => s.startExit);
  const remove = useToastStore((s) => s.remove);
  const remainingRef = useRef(toast.duration);
  const prevDurationRef = useRef(toast.duration);
  const startedAtRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Dedupe update: if the same toast id was re-fired with a new duration, reset countdown.
    if (prevDurationRef.current !== toast.duration) {
      remainingRef.current = toast.duration;
      prevDurationRef.current = toast.duration;
      startedAtRef.current = null;
    }

    if (toast.status === 'exiting') {
      const timer = setTimeout(() => remove(toast.id), TOAST_EXIT_DURATION_MS);
      return () => clearTimeout(timer);
    }

    if (paused) {
      return undefined;
    }

    startedAtRef.current = Date.now();
    timeoutRef.current = setTimeout(() => startExit(toast.id), remainingRef.current);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Capture elapsed time so a subsequent resume continues from where it left off
      // rather than restarting from the full duration.
      if (startedAtRef.current !== null) {
        remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
        startedAtRef.current = null;
      }
    };
  }, [paused, toast.status, toast.id, toast.duration, remove, startExit]);

  const isSuccess = toast.variant === 'success';

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-center gap-3 rounded-[10px] border-[0.5px] px-3 py-4',
        'w-full leading-normal md:w-[320px]',
        toast.status === 'exiting' ? 'bd-toast-exit' : 'bd-toast-enter-mobile md:bd-toast-enter-desktop',
        isSuccess
          ? 'border-[#1a7a52] bg-[#f2fff8] text-[#1a7a52]'
          : 'border-bluedot-charcoal-light text-bluedot-navy bg-white',
      )}
    >
      {isSuccess && <CircledCheckmarkIcon size={20} className="shrink-0 text-[#1a7a52]" aria-hidden />}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-size-xs font-bold break-words">{toast.message}</p>
        {toast.description && <p className="text-size-xxs font-normal break-words">{toast.description}</p>}
      </div>
      {toast.closeButton && (
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => startExit(toast.id)}
          className="shrink-0 cursor-pointer rounded-sm p-1 hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          <CloseIcon size={16} className="stroke-[1.5]" />
        </button>
      )}
    </div>
  );
};

export const Toaster = () => {
  const toasts = useToastStore((s) => s.toasts);
  const setPaused = useToastStore((s) => s.setPaused);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      // Clear paused state if Toaster unmounts while hovered/focused, otherwise
      // future toasts after remount would never auto-dismiss.
      setPaused(false);
    };
  }, [setPaused]);

  if (!mounted) return null;

  return createPortal(
    <>
      <style>{TOAST_STYLES}</style>
      <div
        role="region"
        aria-label="Notifications"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className={cn(
          // z-70 sits one step above Modal/BottomDrawerModal (z-60) so toasts surface over dialogs.
          // Newest toast sits nearest the anchor edge: top on desktop, bottom on mobile.
          'pointer-events-none fixed z-70 flex flex-col gap-2',
          'right-4 bottom-4 left-4 items-center',
          'md:top-4 md:right-4 md:bottom-auto md:left-auto md:flex-col-reverse md:items-end',
        )}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </>,
    document.body,
  );
};
