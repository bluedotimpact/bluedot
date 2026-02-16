import clsx from 'clsx';
import { forwardRef } from 'react';

export type TextareaProps = {
  className?: string;
}
& React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>
& React.RefAttributes<HTMLTextAreaElement>;

export const Textarea: React.ForwardRefExoticComponent<TextareaProps> = forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea className={clsx('px-2 py-1 border-2 border-stone-200 rounded-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-bluedot-normal text-base text-bluedot-black bg-white', props.disabled && 'opacity-40 pointer-events-none', className)} {...props} ref={ref} />
  );
});
