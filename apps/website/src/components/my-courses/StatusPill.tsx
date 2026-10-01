import { cn } from '@bluedot/ui';
import type { ReactNode } from 'react';
import { IoTimeOutline } from 'react-icons/io5';

export type StatusPillProps = {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

const StatusPill = ({ icon, children, className }: StatusPillProps) => (
  <span
    className={cn(
      'inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-bluedot-lighter/30 px-3 py-[7px] text-size-xxs font-medium text-bluedot-darker',
      className,
    )}
  >
    {icon}
    {children}
  </span>
);

// Outline clock with its stroke thickened to match IoBan's line weight.
export const PendingIcon = () => <IoTimeOutline aria-hidden size={14} className="[&_path]:[stroke-width:48]" />;

export default StatusPill;
