import clsx from 'clsx';
import { forwardRef } from 'react';
import { cn } from './utils';

export type InputProps = {
  /** Checkbox/radio only. Text inputs are bare; label them from outside. */
  inputClassName?: string;
  /** Checkbox/radio only. */
  label?: string;
  /** Checkbox/radio only. */
  labelClassName?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
} & React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> &
React.RefAttributes<HTMLInputElement>;

const BASE_LABEL_STYLES = 'input flex gap-2 has-[:disabled]:cursor-not-allowed';

const TEXT_INPUT_STYLES = [
  'w-full h-11 px-3 rounded-surface border border-subtle bg-raised',
  'text-size-sm leading-6 text-primary placeholder:text-placeholder',
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
  'disabled:bg-tint disabled:text-disabled disabled:cursor-not-allowed',
  'aria-invalid:border-error-fg',
  '[&::-webkit-search-cancel-button]:appearance-none',
];

export const Input: React.ForwardRefExoticComponent<InputProps> = forwardRef((
  {
    className, inputClassName, labelClassName, leading, trailing, type = 'text', ...props
  },
  ref,
) => {
  switch (type) {
    case 'checkbox':
      return (
        <label
          className={clsx(
            BASE_LABEL_STYLES,
            'items-center cursor-pointer',
            labelClassName,
          )}
        >
          <input
            {...props}
            ref={ref}
            className={clsx(
              'input--checkbox size-6 accent-bluedot-normal cursor-pointer disabled:cursor-not-allowed',
              inputClassName,
            )}
            type="checkbox"
          />
          {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
          <span className="input__label">{props.label || props.value}</span>
        </label>
      );
    case 'radio':
      return (
        <label
          className={clsx(
            BASE_LABEL_STYLES,
            'items-center cursor-pointer',
            labelClassName,
          )}
        >
          <input
            {...props}
            ref={ref}
            className={clsx(
              'input--radio size-6 accent-bluedot-normal cursor-pointer disabled:cursor-not-allowed',
              inputClassName,
            )}
            type="radio"
          />
          {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
          <span className="input__label">{props.label || props.value}</span>
        </label>
      );
    default: {
      const { label: _label, ...inputProps } = props;
      const input = (
        <input
          {...inputProps}
          ref={ref}
          type={type}
          className={cn(
            TEXT_INPUT_STYLES,
            leading && 'pl-10',
            trailing && 'pr-11',
            className,
          )}
        />
      );

      if (!leading && !trailing) {
        return input;
      }

      return (
        <div className="relative w-full">
          {leading && (
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-secondary">
              {leading}
            </div>
          )}
          {input}
          {trailing && (
            <div className="absolute inset-y-0 right-3 flex items-center text-secondary">
              {trailing}
            </div>
          )}
        </div>
      );
    }
  }
});
