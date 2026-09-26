import type { ReactNode } from 'react';
import { cn } from './utils';

type TabPill<T extends string> = {
  id: T;
  label: ReactNode;
};

export type TabPillsProps<T extends string> = {
  ariaLabel: string;
  tabs: readonly TabPill<T>[];
  value: T;
  onChange: (id: T) => void;
};

export const TabPills = <T extends string>({
  ariaLabel, tabs, value, onChange,
}: TabPillsProps<T>) => (
  <div
    role="group"
    aria-label={ariaLabel}
    className={cn(
      'flex gap-3 overflow-x-auto',
      // Bleed the scroll region to the page edge so a cut-off pill signals more content
      '-mx-spacing-x px-spacing-x',
      // overflow-x-auto also clips vertically; leave room for the focus outline
      '-my-1 py-1',
    )}
  >
    {tabs.map((tab) => {
      const isActive = value === tab.id;
      return (
        <button
          key={tab.id}
          type="button"
          aria-pressed={isActive}
          onClick={() => onChange(tab.id)}
          className={cn(
            'h-11 shrink-0 px-4 rounded-full border text-size-xs font-medium cursor-pointer transition-colors motion-reduce:transition-none',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
            isActive
              ? 'bg-dark border-dark text-on-dark'
              : 'bg-canvas border-default text-primary hover:bg-tint',
          )}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);
