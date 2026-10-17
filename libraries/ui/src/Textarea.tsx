import { forwardRef } from 'react';
import { cn } from './utils';

export type TextareaProps = {
  /** To turn off resizing, pass `resize-none bg-none`: the grip is a background image. */
  className?: string;
}
& React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>
& React.RefAttributes<HTMLTextAreaElement>;

export const Textarea: React.ForwardRefExoticComponent<TextareaProps> = forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'w-full min-h-24 p-3 border border-border-control rounded-surface text-size-sm leading-6 text-primary bg-raised bg-resize-grip placeholder:text-placeholder',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
        'disabled:border-default disabled:bg-surface-disabled disabled:bg-none disabled:text-disabled disabled:cursor-not-allowed disabled:resize-none',
        className,
      )}
      {...props}
      ref={ref}
    />
  );
});
