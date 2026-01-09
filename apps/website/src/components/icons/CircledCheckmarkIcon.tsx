import { cn } from '@bluedot/ui';
import React from 'react';

type CircledCheckmarkIconProps = {
  className?: string;
  size?: number;
};

export const CircledCheckmarkIcon: React.FC<CircledCheckmarkIconProps> = ({
  className,
  size = 16,
}) => (
  <div
    className={cn(
      'box-border rounded-full relative flex items-center justify-center',
      'border-[1.25px] border-bluedot-normal',
      className,
    )}
    style={{ width: size, height: size }}
  >
    <svg
      width={size * 0.5625}
      height={size * 0.5625}
      viewBox="0 0 9 9"
      fill="none"
      className="absolute"
    >
      <path
        className="stroke-bluedot-normal"
        d="M1 4.5L3.5 7L8 1.5"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);
