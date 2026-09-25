import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { FaCheck } from 'react-icons/fa6';
import {
  CHOICE_CARD_NEUTRAL_STYLES,
  CHOICE_CARD_STYLES,
  CHOICE_CONTROL_ROW_FOCUS_STYLES,
  CHOICE_CONTROL_ROW_HOVER_STYLES,
  CHOICE_CONTROL_STYLES,
  CHOICE_ROOT_NEUTRAL_STYLES,
  CHOICE_ROOT_STYLES,
  CHOICE_ROW_STYLES,
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
  CHOICE_CONTROL_STYLES,
  'rounded-surface border border-strong',
  'peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-dark',
  'peer-disabled:not-peer-checked:border-default peer-disabled:not-peer-checked:bg-tint',
  'peer-disabled:peer-checked:opacity-40',
  'peer-aria-invalid:not-peer-disabled:border-error-fg',
];

const BOX_ROW_STYLES = [CHOICE_CONTROL_ROW_HOVER_STYLES, CHOICE_CONTROL_ROW_FOCUS_STYLES];

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
