import type { ReactNode } from 'react';
import { Checkbox as AriaCheckbox } from 'react-aria-components';
import { FaCheck, FaMinus } from 'react-icons/fa6';
import { cn } from './utils';

export type CheckboxProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  indeterminate?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** Bordered, full-width row that highlights when selected. Focus ring moves to the card edge. */
  card?: boolean;
  children?: ReactNode;
  /** Applied to the root label, which carries react-aria's data-* state attributes. */
  className?: string;
};

const ROOT_STYLES = 'flex gap-2 cursor-pointer text-size-sm leading-normal text-primary';

// Figma draws a 32px row; py-2.5 lifts it to the 44px touch floor.
const ROW_STYLES = 'items-start py-2.5';

const CARD_STYLES = 'items-center rounded-surface border-2 border-default bg-canvas p-4 transition-colors motion-reduce:transition-none';

const BOX_STYLES = 'flex size-6 shrink-0 items-center justify-center rounded-surface border transition-colors motion-reduce:transition-none';

export const Checkbox = ({
  checked,
  defaultChecked,
  onChange,
  disabled,
  indeterminate,
  required,
  'aria-invalid': ariaInvalid,
  card,
  children,
  className,
  ...props
}: CheckboxProps) => (
  <AriaCheckbox
    {...props}
    isSelected={checked}
    defaultSelected={defaultChecked}
    onChange={onChange}
    isDisabled={disabled}
    isIndeterminate={indeterminate}
    isRequired={required}
    isInvalid={ariaInvalid}
    className={({
      isSelected, isDisabled, isHovered, isFocusVisible,
    }) => cn(
      ROOT_STYLES,
      card ? CARD_STYLES : ROW_STYLES,
      isDisabled && 'cursor-not-allowed text-disabled',
      card && isSelected && !isDisabled && 'border-accent bg-accent-subtle',
      card && isHovered && !isSelected && !isDisabled && 'bg-tint',
      card && isDisabled && 'bg-tint',
      card && isFocusVisible && 'outline-2 outline-focus',
      className,
    )}
  >
    {({
      isSelected, isIndeterminate, isDisabled, isInvalid, isHovered, isFocusVisible,
    }) => {
      const isFilled = isSelected || isIndeterminate;
      return (
        <>
          <span
            aria-hidden
            className={cn(
              BOX_STYLES,
              isFilled ? 'border-accent bg-accent text-on-dark' : 'border-strong bg-raised',
              !isFilled && isHovered && !isDisabled && !card && 'border-accent',
              isDisabled && (isFilled ? 'opacity-40' : 'border-default bg-tint'),
              isInvalid && !isDisabled && 'border-error-fg',
              isFocusVisible && !card && 'outline-2 outline-offset-2 outline-focus',
            )}
          >
            {isIndeterminate && <FaMinus className="size-3.5" />}
            {isSelected && !isIndeterminate && <FaCheck className="size-3.5" />}
          </span>
          {children}
        </>
      );
    }}
  </AriaCheckbox>
);
