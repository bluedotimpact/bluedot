import { cn } from './utils';

type ProgressDotsProps = {
  className?: string;
  dotClassName?: string;
};

export const ProgressDots: React.FC<ProgressDotsProps> = ({ className, dotClassName }) => {
  return (
    <div className={cn('progress-dots flex justify-center space-x-2 my-6', className)}>
      <span className={cn('size-2 bg-bluedot-normal rounded-full animate-bounce', dotClassName)} style={{ animationDelay: '0ms' }} />
      <span className={cn('size-2 bg-bluedot-normal rounded-full animate-bounce', dotClassName)} style={{ animationDelay: '150ms' }} />
      <span className={cn('size-2 bg-bluedot-normal rounded-full animate-bounce', dotClassName)} style={{ animationDelay: '300ms' }} />
    </div>
  );
};
