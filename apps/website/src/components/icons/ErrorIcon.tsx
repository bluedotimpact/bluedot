import { cn } from '@bluedot/ui';

type ErrorIconProps = {
  className?: string;
  size?: number;
};

export const ErrorIcon = ({ className, size = 16 }: ErrorIconProps) => (
  <div
    className={cn(
      'relative box-border flex items-center justify-center rounded-full text-[#DC0000]',
      'border-[1.25px] border-current',
      className,
    )}
    style={{ width: size, height: size }}
  >
    <svg width={size * 0.625} height={size * 0.625} viewBox="0 0 10 10" fill="none">
      <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  </div>
);
