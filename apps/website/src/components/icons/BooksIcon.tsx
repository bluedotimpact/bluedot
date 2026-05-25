import { cn } from '@bluedot/ui';
import type { IconProps } from './types';

type BooksIconProps = Omit<IconProps, 'size'> & { size?: number };

export const BooksIcon = ({ size = 80, className, ...props }: BooksIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 80 80"
    fill="none"
    width={size}
    height={size}
    className={cn(className)}
    {...props}
  >
    <path
      d="M16.6666 16.6663C16.6666 15.7823 17.0178 14.9344 17.6429 14.3093C18.2681 13.6842 19.1159 13.333 20 13.333H26.6666C27.5507 13.333 28.3985 13.6842 29.0236 14.3093C29.6488 14.9344 30 15.7823 30 16.6663V63.333C30 64.2171 29.6488 65.0649 29.0236 65.69C28.3985 66.3152 27.5507 66.6663 26.6666 66.6663H20C19.1159 66.6663 18.2681 66.3152 17.6429 65.69C17.0178 65.0649 16.6666 64.2171 16.6666 63.333V16.6663Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M30 16.6663C30 15.7823 30.3512 14.9344 30.9763 14.3093C31.6014 13.6842 32.4493 13.333 33.3333 13.333H40C40.8841 13.333 41.7319 13.6842 42.357 14.3093C42.9821 14.9344 43.3333 15.7823 43.3333 16.6663V63.333C43.3333 64.2171 42.9821 65.0649 42.357 65.69C41.7319 66.3152 40.8841 66.6663 40 66.6663H33.3333C32.4493 66.6663 31.6014 66.3152 30.9763 65.69C30.3512 65.0649 30 64.2171 30 63.333V16.6663Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M16.6666 26.667H30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M30 53.333H43.3333" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M53.29 13.4338L46.01 15.2005L45.5667 15.3371C44.7715 15.6294 44.1141 16.208 43.7232 16.9596C43.3323 17.7112 43.2361 18.5816 43.4533 19.4005L55.77 64.1271C56.2667 65.9338 58.17 67.0171 60.0433 66.5671L67.3233 64.8005L67.7667 64.6638C68.5618 64.3715 69.2193 63.793 69.6102 63.0414C70.0011 62.2898 70.0973 61.4193 69.88 60.6005L57.5633 15.8738C57.0667 14.0671 55.1633 12.9838 53.29 13.4338Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M46.6666 30.0003L60 26.667" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M53.3334 53.3331L66.41 50.0664" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
