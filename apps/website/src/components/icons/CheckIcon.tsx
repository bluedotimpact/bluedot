import type { IconProps } from './types';

export const CheckIcon = ({ size = 30, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" fill="none" width={size} height={size} {...props}>
    <path
      d="M25 7.5L11.25 21.25L5 15"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
