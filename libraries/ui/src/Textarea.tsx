import { forwardRef } from 'react';
import { cn } from './utils';

export type TextareaProps = {
  className?: string;
}
& React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>
& React.RefAttributes<HTMLTextAreaElement>;

export const Textarea: React.ForwardRefExoticComponent<TextareaProps> = forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'w-full px-2 py-1 border-2 border-subtle rounded-sm text-size-sm leading-6 text-primary bg-raised placeholder:text-placeholder',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
        'disabled:bg-tint disabled:text-disabled disabled:cursor-not-allowed',
        className,
      )}
      {...props}
      ref={ref}
    />
  );
});
