import { cn } from '@bluedot/ui';
import React from 'react';

type ErrorIconProps = {
  className?: string;
  size?: number;
};

export const ErrorIcon: React.FC<ErrorIconProps> = ({
  className,
  size = 16,
}) => (
  <div
    className={cn(
      'box-border rounded-full relative flex items-center justify-center',
      'border-[1.25px] border-[#DC0000]',
      className,
    )}
    style={{ width: size, height: size }}
  >
    <svg
      width={size * 0.625}
      height={size * 0.625}
      viewBox="0 0 10 10"
      fill="none"
    >
      <path
        d="M2 2L8 8M8 2L2 8"
        stroke="#DC0000"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

