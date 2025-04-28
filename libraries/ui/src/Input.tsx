import clsx from 'clsx';
import { forwardRef } from 'react';

export type InputProps = {
  className?: string
}
& React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
& React.RefAttributes<HTMLInputElement>;

export const Input: React.ForwardRefExoticComponent<InputProps> = forwardRef(({ className, ...props }, ref) => {
  if (props.type === 'checkbox') {
    return (
      <input className={className} {...props} ref={ref} />
    );
  }

  return (
    <input className={clsx('px-2 py-1 border-2 border-stone-200 rounded-xs focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-bluedot-normal text-base text-bluedot-black bg-white', props.disabled && 'opacity-40 pointer-events-none', className)} {...props} ref={ref} />
  );
});
