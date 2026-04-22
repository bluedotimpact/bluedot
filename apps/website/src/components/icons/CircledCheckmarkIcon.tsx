import { cn } from '@bluedot/ui';

type CircledCheckmarkIconProps = {
  className?: string;
  size?: number;
};

export const CircledCheckmarkIcon = ({ className, size = 16 }: CircledCheckmarkIconProps) => (
  <div
    className={cn(
      'text-bluedot-normal relative box-border flex items-center justify-center rounded-full',
      'border-[1.25px] border-current',
      className,
    )}
    style={{ width: size, height: size }}
  >
    <svg width={size * 0.5625} height={size * 0.5625} viewBox="0 0 9 9" fill="none" className="absolute stroke-current">
      <path d="M1 4.5L3.5 7L8 1.5" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);
