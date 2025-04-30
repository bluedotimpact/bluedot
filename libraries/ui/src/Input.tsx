import clsx from 'clsx';
import { forwardRef } from 'react';

export type InputProps = {
  inputClassName?: string,
  label?: string,
  labelClassName?: string,
}
& React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
& React.RefAttributes<HTMLInputElement>;

export const Input: React.ForwardRefExoticComponent<InputProps> = forwardRef(({
  className,
  inputClassName,
  labelClassName,
  ...props
}, ref) => {
  switch (props.type) {
    case 'checkbox':
      return (
        <label className={clsx('input flex items-center gap-2 cursor-pointer', labelClassName)}>
          <input
            {...props}
            ref={ref}
            className={clsx('input--checkbox size-6 accent-bluedot-normal rounded cursor-pointer', inputClassName)}
            type="checkbox"
          />
          <span className='input__label'>{props.label || props.value}</span>
        </label>
      );
    case 'radio':
      return (
        <label className={clsx('input flex items-center gap-2 cursor-pointer', labelClassName)}>
          <input
            {...props}
            ref={ref}
            className={clsx('input--radio size-6 accent-bluedot-normal rounded cursor-pointer', inputClassName)}
            type="radio"
          />
          <span className='input__label'>{props.label || props.value}</span>
        </label>
      );
    default:
      return (
        <label className={clsx('input flex flex-col gap-2', labelClassName)}>
          <span className='input__label'>{props.label}</span>
          <input
            {...props}
            ref={ref}
            className={clsx('input--text border border-color-divider rounded-lg p-4 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-bluedot-normal', inputClassName)}
            type="text"
          />
        </label>
      );
  }
});
