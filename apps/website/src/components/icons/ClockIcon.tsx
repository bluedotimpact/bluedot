import React from 'react';

export const ClockIcon: React.FC<{
  className?: string;
  fill?: string;
  size?: number;
  stroke?: string;
}> = ({
  className, fill = 'currentColor', stroke = 'currentColor', size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M21 12.75C20.6184 17.37 16.7184 21 12 21C9.61305 21 7.32387 20.0518 5.63604 18.364C3.94821 16.6761 3 14.3869 3 12C3 7.28156 6.63 3.38156 11.25 3"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 6.75V12H17.25" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M15 4.5C15.6213 4.5 16.125 3.99632 16.125 3.375C16.125 2.75368 15.6213 2.25 15 2.25C14.3787 2.25 13.875 2.75368 13.875 3.375C13.875 3.99632 14.3787 4.5 15 4.5Z"
      fill={fill}
    />
    <path
      d="M18.375 6.75C18.9963 6.75 19.5 6.24632 19.5 5.625C19.5 5.00368 18.9963 4.5 18.375 4.5C17.7537 4.5 17.25 5.00368 17.25 5.625C17.25 6.24632 17.7537 6.75 18.375 6.75Z"
      fill={fill}
    />
    <path
      d="M20.625 10.125C21.2463 10.125 21.75 9.62132 21.75 9C21.75 8.37868 21.2463 7.875 20.625 7.875C20.0037 7.875 19.5 8.37868 19.5 9C19.5 9.62132 20.0037 10.125 20.625 10.125Z"
      fill={fill}
    />
  </svg>
);
