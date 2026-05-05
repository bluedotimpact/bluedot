import type { ReactNode } from 'react';

export type Tab<T extends string> = {
  id: T;
  label: ReactNode;
};

type TabPillsProps<T extends string> = {
  ariaLabel: string;
  tabs: readonly Tab<T>[];
  value: T;
  onChange: (id: T) => void;
};

const TabPill = <T extends string>({
  tab, isActive, onClick,
}: { tab: Tab<T>; isActive: boolean; onClick: () => void }) => (
  <button
    type="button"
    role="tab"
    aria-selected={isActive}
    onClick={onClick}
    className={`h-10 px-4 rounded-full border text-size-xs font-medium cursor-pointer transition-colors ${
      isActive
        ? 'bg-bluedot-navy text-white border-bluedot-navy'
        : 'bg-white text-bluedot-navy border-color-divider hover:bg-bluedot-navy/5'
    }`}
  >
    {tab.label}
  </button>
);

const TabPills = <T extends string>({
  ariaLabel, tabs, value, onChange,
}: TabPillsProps<T>) => (
  <div role="tablist" aria-label={ariaLabel} className="flex gap-3">
    {tabs.map((tab) => (
      <TabPill
        key={tab.id}
        tab={tab}
        isActive={value === tab.id}
        onClick={() => onChange(tab.id)}
      />
    ))}
  </div>
);

export default TabPills;
