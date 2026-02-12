import clsx from 'clsx';
import { forwardRef } from 'react';

export type InputProps = {
  inputClassName?: string;
  label?: string;
  labelClassName?: string;
} & React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> &
React.RefAttributes<HTMLInputElement>;

const BASE_LABEL_STYLES = 'input flex gap-2 cursor-pointer has-[:disabled]:cursor-not-allowed';

export const Input: React.ForwardRefExoticComponent<InputProps> = forwardRef((
  {
    className, inputClassName, labelClassName, type = 'text', ...props
  },
  ref,
) => {
  switch (type) {
    case 'checkbox':
      return (
        <label
          className={clsx(
            BASE_LABEL_STYLES,
            'items-center',
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
            'items-center',
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
    default:
      return (
        <label className={clsx(BASE_LABEL_STYLES, 'flex-col', labelClassName)}>
          <span className="input__label">{props.label}</span>
          <input
            {...props}
            ref={ref}
            type={type}
            className={clsx(
              'input--text border border-color-divider rounded-lg p-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-bluedot-normal disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
              inputClassName,
            )}
          />
        </label>
      );
  }
});
