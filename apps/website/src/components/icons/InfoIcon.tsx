import type { IconProps } from './types';

type InfoIconProps = IconProps & {
  bgFill?: string;
  fgFill?: string;
};

export const InfoIcon = ({ size = 20, bgFill = '#1D4ED8', fgFill = 'white', ...props }: InfoIconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
    <circle cx="10" cy="10" r="10" fill={bgFill} />
    <path d="M10 14V9" stroke={fgFill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10" cy="6.5" r="0.75" fill={fgFill} />
  </svg>
);
