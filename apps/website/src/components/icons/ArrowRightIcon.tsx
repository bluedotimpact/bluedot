import type { IconProps } from './types';

// Narrow `size` to number: viewBox is 12x10 (non-square), height is size * (5/6).
type ArrowRightIconProps = Omit<IconProps, 'size'> & {
  size?: number;
};

export const ArrowRightIcon = ({ size = 12, ...props }: ArrowRightIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 10"
    fill="none"
    width={size}
    height={size * (5 / 6)}
    {...props}
  >
    <path
      d="M6.90887 10L6.08856 9.19034L9.46569 5.81321H0.719238V4.64133H9.46569L6.08856 1.27486L6.90887 0.454546L11.6816 5.22727L6.90887 10Z"
      fill="currentColor"
    />
  </svg>
);
