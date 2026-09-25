import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import type { ClassValue } from 'clsx';
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

export type RadioTone = 'success' | 'error';

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> & {
  /** Bordered, full-width row that highlights when selected. Focus ring moves to the card edge. */
  card?: boolean;
  tone?: RadioTone;
  /** Applied to the root label. */
  className?: string;
};

// The dot inherits the ring colour via `bg-current`.
const INDICATOR_STYLES = [CHOICE_CONTROL_STYLES, 'rounded-full border-2'];

const TONE_STYLES: Record<RadioTone | 'neutral', { root: ClassValue; card: ClassValue; indicator: ClassValue }> = {
  neutral: {
    root: CHOICE_ROOT_NEUTRAL_STYLES,
    card: CHOICE_CARD_NEUTRAL_STYLES,
    indicator: [
      'border-strong',
      'peer-checked:border-accent peer-checked:text-accent',
      'peer-disabled:not-peer-checked:border-default peer-disabled:not-peer-checked:bg-tint',
      'peer-disabled:peer-checked:opacity-40',
      'peer-aria-invalid:not-peer-disabled:border-error-fg peer-aria-invalid:not-peer-disabled:text-error-fg',
    ],
  },
  success: {
    root: 'text-success-fg',
    card: 'border-success-border bg-success-bg',
    indicator: 'border-success-fg peer-checked:text-success-fg',
  },
  error: {
    root: 'text-error-fg',
    card: 'border-error-border bg-error-bg',
    indicator: 'border-error-fg peer-checked:text-error-fg',
  },
};

export const Radio = forwardRef<HTMLInputElement, RadioProps>(({
  card,
  tone,
  children,
  className,
  ...props
}, ref) => {
  const toneStyles = TONE_STYLES[tone ?? 'neutral'];

  return (
    <label
      className={cn(
        CHOICE_ROOT_STYLES,
        toneStyles.root,
        card ? [CHOICE_CARD_STYLES, toneStyles.card] : CHOICE_ROW_STYLES,
        className,
      )}
    >
      <input {...props} ref={ref} type="radio" className="peer sr-only" />
      <span
        aria-hidden
        className={cn(
          INDICATOR_STYLES,
          toneStyles.indicator,
          !card && CHOICE_CONTROL_ROW_FOCUS_STYLES,
          // Tone owns the ring colour; the accent hover would out-rank it on specificity.
          !card && !tone && CHOICE_CONTROL_ROW_HOVER_STYLES,
        )}
      >
        <span className="size-2.5 rounded-full bg-current" />
      </span>
      {children}
    </label>
  );
});

Radio.displayName = 'Radio';
