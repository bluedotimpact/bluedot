import { forwardRef } from 'react';
import { ResizeHandleIcon } from './ResizeHandleIcon';
import { cn } from './utils';

export type TextareaProps = {
  className?: string;
}
& React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>
& React.RefAttributes<HTMLTextAreaElement>;

export const Textarea: React.ForwardRefExoticComponent<TextareaProps> = forwardRef(({ className, ...props }, ref) => {
  // The native grip sits flush in the corner and can't be moved. Where browsers let us hide it
  // (not Firefox) we draw an inset one instead; the corner stays draggable either way.
  return (
    <div className={cn('relative w-full', className)}>
      <textarea
        className={cn(
          'block w-full min-h-24 p-3 border border-border-control rounded-surface text-size-sm leading-6 text-primary bg-raised placeholder:text-placeholder',
          'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
          'disabled:border-default disabled:bg-surface-disabled disabled:text-disabled disabled:cursor-not-allowed disabled:resize-none',
          '[&::-webkit-resizer]:hidden',
        )}
        {...props}
        ref={ref}
      />
      {!props.disabled && (
        <ResizeHandleIcon
          aria-hidden="true"
          className="pointer-events-none absolute right-1 bottom-1 size-4 text-secondary hidden supports-[selector(::-webkit-resizer)]:block"
        />
      )}
    </div>
  );
});
