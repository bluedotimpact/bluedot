import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import {
  CHOICE_CARD_NEUTRAL_STYLES, CHOICE_CARD_STYLES, CHOICE_ROOT_NEUTRAL_STYLES, CHOICE_ROOT_STYLES, CHOICE_ROW_STYLES,
} from './choiceStyles';
import { cn } from './utils';

export type RadioTone = 'success' | 'error';

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> & {
  /** Bordered, full-width row that highlights when selected. Focus ring moves to the card edge. */
  card?: boolean;
  /**
   * Post-submit result colouring (quiz correct/incorrect). Replaces the selected/disabled recipe
   * rather than layering on it, so a locked correct answer still reads as correct. Colour is the
   * only signal this adds; pair it with visible text.
   */
  tone?: RadioTone;
  /** Applied to the root label. */
  className?: string;
};

// The dot inherits the ring colour via `bg-current`, so it stays transparent until checked.
const INDICATOR_STYLES = [
  'flex size-6 shrink-0 items-center justify-center rounded-full border-2 bg-raised text-transparent',
  'transition-colors motion-reduce:transition-none',
];

const INDICATOR_NEUTRAL_STYLES = [
  'border-strong',
  'peer-checked:border-accent peer-checked:text-accent',
  'peer-disabled:not-peer-checked:border-default peer-disabled:not-peer-checked:bg-tint',
  'peer-disabled:peer-checked:opacity-40',
  'peer-aria-invalid:not-peer-disabled:border-error-fg peer-aria-invalid:not-peer-disabled:text-error-fg',
];

// Row only: the card carries its own hover and focus treatment.
const INDICATOR_ROW_FOCUS_STYLES = 'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus';
const INDICATOR_ROW_HOVER_STYLES = 'group-hover:not-peer-disabled:border-accent';

const TONE_STYLES: Record<RadioTone, { root: string; card: string; indicator: string }> = {
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
  const toneStyles = tone ? TONE_STYLES[tone] : undefined;

  return (
    <label
      data-tone={tone}
      className={cn(
        CHOICE_ROOT_STYLES,
        toneStyles ? toneStyles.root : CHOICE_ROOT_NEUTRAL_STYLES,
        card ? [CHOICE_CARD_STYLES, toneStyles ? toneStyles.card : CHOICE_CARD_NEUTRAL_STYLES] : CHOICE_ROW_STYLES,
        className,
      )}
    >
      <input {...props} ref={ref} type="radio" className="peer sr-only" />
      <span
        aria-hidden
        className={cn(
          INDICATOR_STYLES,
          toneStyles ? toneStyles.indicator : INDICATOR_NEUTRAL_STYLES,
          !card && INDICATOR_ROW_FOCUS_STYLES,
          !card && !toneStyles && INDICATOR_ROW_HOVER_STYLES,
        )}
      >
        <span className="size-2.5 rounded-full bg-current" />
      </span>
      {children}
    </label>
  );
});

Radio.displayName = 'Radio';
