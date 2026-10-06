import { cn } from './utils';

type ProgressDotsProps = {
  className?: string;
};

const DOT_CLASSES = 'size-2 rounded-full bg-current motion-safe:animate-bounce motion-reduce:animate-pulse';

export const ProgressDots: React.FC<ProgressDotsProps> = ({ className }) => {
  return (
    <span role="status" className={cn('my-6 flex items-center justify-center gap-2 text-accent', className)}>
      <Dots />
      <span className="sr-only">Loading…</span>
    </span>
  );
};

// Bare animated dots, no status role or label: for hosts that already announce busy state (e.g. a button with aria-busy).
// Renders as siblings so the host's flex gap spaces them.
export const Dots = () => (
  <>
    <span aria-hidden className={DOT_CLASSES} style={{ animationDelay: '0ms' }} />
    <span aria-hidden className={DOT_CLASSES} style={{ animationDelay: '150ms' }} />
    <span aria-hidden className={DOT_CLASSES} style={{ animationDelay: '300ms' }} />
  </>
);
