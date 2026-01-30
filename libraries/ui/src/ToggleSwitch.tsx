import React from 'react';
import { cn } from './utils';

export type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  'aria-label'?: string;
};

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, 'aria-label': ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 cursor-pointer',
      checked ? 'bg-bluedot-normal' : 'bg-[#D1D5DB]',
    )}
  >
    <span
      className={cn(
        'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200',
        checked ? 'translate-x-[18px]' : 'translate-x-[3px]',
      )}
    />
  </button>
);
