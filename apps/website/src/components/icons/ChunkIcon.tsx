import { cn } from '@bluedot/ui';
import type { IconProps } from './types';

type ChunkIconProps = IconProps & {
  isActive?: boolean;
};

export const ChunkIcon = ({
  isActive,
  size = 24,
  className,
  ...props
}: ChunkIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    className={cn(isActive ? 'text-bluedot-navy' : 'text-[#6A6F7A]/30', className)}
    {...props}
  >
    <path
      d="M12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    {isActive && <circle cx="12" cy="12" r="5" fill="currentColor" />}
  </svg>
);
