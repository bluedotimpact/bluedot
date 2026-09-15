import { cn } from './utils';

type ProgressDotsProps = {
  className?: string;
};

const DOT_CLASSES = 'size-2 rounded-full bg-current motion-safe:animate-bounce motion-reduce:animate-pulse';

export const ProgressDots: React.FC<ProgressDotsProps> = ({ className }) => {
  return (
    <div className={cn('progress-dots my-6 flex items-center justify-center space-x-2', className)}>
    </div>
      <span aria-hidden className={DOT_CLASSES} style={{ animationDelay: '0ms' }} />
      <span aria-hidden className={DOT_CLASSES} style={{ animationDelay: '150ms' }} />
      <span aria-hidden className={DOT_CLASSES} style={{ animationDelay: '300ms' }} />
      <span className="sr-only">Loading…</span>
  );
};
