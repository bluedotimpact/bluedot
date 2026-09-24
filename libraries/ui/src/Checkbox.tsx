import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { FaCheck } from 'react-icons/fa6';
import {
  CHOICE_CARD_NEUTRAL_STYLES, CHOICE_CARD_STYLES, CHOICE_ROOT_NEUTRAL_STYLES, CHOICE_ROOT_STYLES, CHOICE_ROW_STYLES,
} from './choiceStyles';
import { cn } from './utils';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> & {
  /** Bordered, full-width row that highlights when selected. Focus ring moves to the card edge. */
  card?: boolean;
  /** Applied to the root label. */
  className?: string;
};

// Glyph is always rendered and inherits the box colour, so it stays transparent until the box fills.
const BOX_STYLES = [
  'flex size-6 shrink-0 items-center justify-center rounded-surface border border-strong bg-raised text-transparent',
  'transition-colors motion-reduce:transition-none',
  'peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-dark',
  'peer-disabled:not-peer-checked:border-default peer-disabled:not-peer-checked:bg-tint',
  'peer-disabled:peer-checked:opacity-40',
  'peer-aria-invalid:not-peer-disabled:border-error-fg',
];

// Row only: the card carries its own hover and focus treatment.
const BOX_ROW_STYLES = [
  'group-hover:not-peer-disabled:border-accent',
  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus',
];

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  card,
  children,
  className,
  ...props
}, ref) => (
  <label
    className={cn(
      CHOICE_ROOT_STYLES,
      CHOICE_ROOT_NEUTRAL_STYLES,
      card ? [CHOICE_CARD_STYLES, CHOICE_CARD_NEUTRAL_STYLES] : CHOICE_ROW_STYLES,
      className,
    )}
  >
    <input {...props} ref={ref} type="checkbox" className="peer sr-only" />
    <span aria-hidden className={cn(BOX_STYLES, !card && BOX_ROW_STYLES)}>
      <FaCheck className="size-3.5" />
    </span>
    {children}
  </label>
));

Checkbox.displayName = 'Checkbox';
