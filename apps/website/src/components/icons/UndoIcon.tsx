import { cn } from '@bluedot/ui';
import React from 'react';

type UndoIconProps = {
  className?: string;
  size?: number;
};

export const UndoIcon: React.FC<UndoIconProps> = ({ className, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('stroke-current', className)}
    aria-hidden="true"
  >
    {/* TODO check if there are other cases that use this and make them adopt this icon as well. Also check if there's a duplicate undo icon we use elsewhere that we can unify on a single version */}
    <path
      d="M1.5 3.49994V6.49994M1.5 6.49994H4.5M1.5 6.49994L4.11063 4.11056C4.87508 3.34625 5.84782 2.82415 6.90729 2.60951C7.96677 2.39487 9.06601 2.4972 10.0677 2.90372C11.0693 3.31024 11.929 4.00291 12.5392 4.8952C13.1494 5.78749 13.4832 6.83982 13.4988 7.92071C13.5144 9.0016 13.2111 10.0631 12.6268 10.9726C12.0426 11.8821 11.2033 12.5993 10.2137 13.0345C9.22422 13.4698 8.12838 13.6037 7.06316 13.4197C5.99793 13.2357 5.01055 12.7419 4.22438 11.9999"
      strokeWidth="1.25"
      strokeLinecap="square"
    />
  </svg>
);
