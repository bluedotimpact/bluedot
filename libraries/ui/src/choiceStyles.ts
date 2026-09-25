// Shared by Checkbox and Radio. The native input is visually hidden (`peer sr-only`); the label
// (`group`, `has-*`) and the drawn control (`peer-*`) read its state.
//
// Colour is split from layout so Radio can swap the neutral recipe for a tone (success/error)
// without fighting the `has-disabled:` / `has-checked:` variants on specificity.

export const CHOICE_ROOT_STYLES = 'group flex gap-2 cursor-pointer text-size-sm leading-normal has-disabled:cursor-not-allowed';

export const CHOICE_ROOT_NEUTRAL_STYLES = 'text-primary has-disabled:text-disabled';

// Figma draws a 32px row; py-2.5 lifts it to the 44px touch floor.
export const CHOICE_ROW_STYLES = 'items-start py-2.5';

export const CHOICE_CARD_STYLES = [
  'items-center rounded-surface border-2 p-4 transition-colors motion-reduce:transition-none',
  'has-focus-visible:outline-2 has-focus-visible:outline-focus',
];

export const CHOICE_CARD_NEUTRAL_STYLES = [
  'border-default bg-canvas',
  'hover:not-has-checked:not-has-disabled:bg-tint',
  'has-checked:not-has-disabled:border-accent has-checked:not-has-disabled:bg-accent-subtle',
  'has-disabled:bg-tint',
];

// The drawn control (Checkbox box, Radio ring). Each adds its own shape and state colours.
// `text-transparent` hides the glyph/dot until a state colour replaces it.
export const CHOICE_CONTROL_STYLES = [
  'flex size-6 shrink-0 items-center justify-center bg-raised text-transparent',
  'transition-colors motion-reduce:transition-none',
];

// Row only: the card carries its own hover and focus treatment.
export const CHOICE_CONTROL_ROW_HOVER_STYLES = 'group-hover:not-peer-disabled:border-accent';
export const CHOICE_CONTROL_ROW_FOCUS_STYLES = 'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus';
