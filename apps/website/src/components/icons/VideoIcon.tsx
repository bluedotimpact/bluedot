import type { IconProps } from './types';

export const VideoIcon = ({ size = 14, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 14 14"
    fill="none"
    width={size}
    height={size}
    {...props}
  >
    <path
      d="M13.4166 4.08341L9.33331 7.00008L13.4166 9.91675V4.08341Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.16665 2.91675H1.74998C1.10565 2.91675 0.583313 3.43908 0.583313 4.08341V9.91675C0.583313 10.5611 1.10565 11.0834 1.74998 11.0834H8.16665C8.81098 11.0834 9.33331 10.5611 9.33331 9.91675V4.08341C9.33331 3.43908 8.81098 2.91675 8.16665 2.91675Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
