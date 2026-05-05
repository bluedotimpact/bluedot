import type { ReactNode } from 'react';

type TabPillsProps = {
  ariaLabel: string;
  children: ReactNode;
};

const TabPills = ({ ariaLabel, children }: TabPillsProps) => (
  <div role="tablist" aria-label={ariaLabel} className="flex gap-2">
    {children}
  </div>
);

export default TabPills;
