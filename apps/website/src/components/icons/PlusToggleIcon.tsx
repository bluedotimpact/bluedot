import type { IconProps } from './types';

// Narrow `size` to number: viewBox is 16x17 (non-square), height is size * (17/16).
type PlusToggleIconProps = Omit<IconProps, 'size'> & {
  size?: number;
};

export const PlusToggleIcon = ({ size = 16, ...props }: PlusToggleIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 17"
    fill="none"
    width={size}
    height={size * (17 / 16)}
    {...props}
  >
    <path d="M0 8.5H16M8 0.5L8 16.5" stroke="currentColor" strokeWidth="2" />
  </svg>
);
