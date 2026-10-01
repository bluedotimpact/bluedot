import { cn } from '@bluedot/ui';
import type { SVGProps } from 'react';

// clipPath id is stable since this icon is used at most once per page.
export const ResizeHandleIcon = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 15 14"
    fill="none"
    width={15}
    height={14}
    className={cn('text-bluedot-navy', className)}
    {...props}
  >
    <g opacity="0.6" clipPath="url(#resize-handle-clip)">
      <path d="M11.875 7L7.5 11.375" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 2.1875L2.6875 10.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <defs>
      <clipPath id="resize-handle-clip">
        <rect width="14" height="14" fill="white" transform="translate(0.5)" />
      </clipPath>
    </defs>
  </svg>
);
