import type { IconProps } from './types';

export const MoonStarsIcon = ({ size = 20, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
    <path
      d="M16.25 9.375V5.625"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.125 7.5H14.375"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12.5 2.5V5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.75 3.75H11.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M16.4602 12.3578C15.9793 12.4524 15.4903 12.5 15.0001 12.5C13.8916 12.499 12.7971 12.2526 11.7952 11.7784C10.7933 11.3042 9.90882 10.614 9.20536 9.75732C8.50191 8.90067 7.99691 7.89885 7.72665 6.82383C7.45639 5.74881 7.42758 4.62727 7.64228 3.53979C6.55743 3.9365 5.59002 4.60016 4.82939 5.46948C4.06876 6.3388 3.53942 7.38575 3.29026 8.51367C3.0411 9.64159 3.08015 10.8141 3.4038 11.9229C3.72745 13.0318 4.32527 14.0412 5.14206 14.858C5.95884 15.6748 6.96826 16.2726 8.0771 16.5962C9.18594 16.9199 10.3585 16.9589 11.4864 16.7098C12.6143 16.4606 13.6612 15.9313 14.5306 15.1707C15.3999 14.41 16.0635 13.4426 16.4602 12.3578Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
