import type { IconProps } from './types';

// Narrow `size` to number: viewBox is 39x37 (non-square), height is size * (37/39).
// stroke and fill are fixed amber colors — not currentColor.
// Omit `fill` so callers can't accidentally override the path's explicit fill values.
type StarIconProps = Omit<IconProps, 'size' | 'fill'> & {
  size?: number;
  filled?: boolean;
};

export const StarIcon = ({ size = 39, filled = false, ...props }: StarIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 39 37"
    fill="none"
    width={size}
    height={size * (37 / 39)}
    {...props}
  >
    <path
      d="M24.4794 11.4922C24.7341 12.008 25.1966 12.3851 25.744 12.5352L25.9833 12.585L37.2802 14.2363L29.1073 22.1963C28.665 22.6271 28.4482 23.2364 28.5145 23.8457L28.5321 23.9678L30.4608 35.2119L20.3593 29.8994C19.813 29.6123 19.167 29.5944 18.6083 29.8457L18.4979 29.8994L8.39636 35.2119L10.3251 23.9678C10.4364 23.3187 10.2216 22.6558 9.74988 22.1963L1.57703 14.2363L12.8739 12.585C13.5243 12.4898 14.0867 12.0816 14.3778 11.4922L19.4286 1.25879L24.4794 11.4922Z"
      stroke="#FFAE36"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={filled ? '#FFC16A' : 'transparent'}
      style={{ transition: 'fill 0.1s ease-in-out' }}
    />
  </svg>
);
