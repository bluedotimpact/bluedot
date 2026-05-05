import type { ReactNode } from 'react';

type TabPillProps = {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
};

const TabPill = ({ isActive, onClick, children }: TabPillProps) => (
  <button
    type="button"
    role="tab"
    aria-selected={isActive}
    onClick={onClick}
    className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-colors ${
      isActive
        ? 'bg-bluedot-darker text-white border-bluedot-darker'
        : 'bg-white text-bluedot-navy border-bluedot-navy/20 hover:bg-bluedot-navy/5'
    }`}
  >
    {children}
  </button>
);

export default TabPill;
