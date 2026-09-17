import type React from 'react';
import { cn } from './utils';

export type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
};

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked, onChange, disabled, 'aria-label': ariaLabel,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 motion-reduce:transition-none cursor-pointer',
      checked ? 'bg-accent' : 'bg-default',
    )}
  >
    <span
      className={cn(
        'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200 motion-reduce:transition-none',
        checked ? 'translate-x-[18px]' : 'translate-x-[3px]',
      )}
    />
  </button>
);
