import type { ReactNode } from 'react';

export type StatusPillProps = {
  icon?: ReactNode;
  children: ReactNode;
};

const StatusPill = ({ icon, children }: StatusPillProps) => (
  <span className="inline-flex h-9 items-center gap-1 rounded-full bg-bluedot-lighter/30 px-3 py-[7px] text-size-xxs font-medium text-bluedot-darker">
    {icon}
    {children}
  </span>
);

export default StatusPill;
