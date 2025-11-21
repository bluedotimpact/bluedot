import { cn } from './utils';

type ProgressDotsProps = {
  className?: string;
};

export const ProgressDots: React.FC<ProgressDotsProps> = ({ className }) => {
  return (
    <div className={cn('progress-dots flex justify-center space-x-2 my-6', className)}>
      <span className="size-2 bg-bluedot-normal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="size-2 bg-bluedot-normal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="size-2 bg-bluedot-normal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};
