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
  children?: ReactNode;
  /** Applied to the root label, which carries react-aria's data-* state attributes. */
  className?: string;
};

// 44px row via padding: Figma draws 32, but the touch floor wins. See docs/design-system-review/checkbox.md.
const ROOT_STYLES = 'flex items-start gap-2 py-2.5 cursor-pointer text-size-sm leading-normal text-primary';

const BOX_STYLES = 'flex size-6 shrink-0 items-center justify-center rounded-surface border transition-colors motion-reduce:transition-none';

export const Checkbox = ({
  checked,
  defaultChecked,
  onChange,
  disabled,
  indeterminate,
  required,
  'aria-invalid': ariaInvalid,
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
    className={({ isDisabled }) => cn(
      ROOT_STYLES,
      isDisabled && 'cursor-not-allowed text-disabled',
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
              !isFilled && isHovered && !isDisabled && 'border-accent',
              isDisabled && (isFilled ? 'opacity-40' : 'border-default bg-tint'),
              isInvalid && !isDisabled && 'border-error-fg',
              isFocusVisible && 'outline-2 outline-offset-2 outline-focus',
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
