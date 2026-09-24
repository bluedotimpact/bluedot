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
