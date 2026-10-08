import { forwardRef } from 'react';
import { useFieldControlProps } from './Field';
import { cn } from './utils';

export type TextareaProps = {
  className?: string;
}
& React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>
& React.RefAttributes<HTMLTextAreaElement>;

export const Textarea: React.ForwardRefExoticComponent<TextareaProps> = forwardRef(({ className, ...rest }, ref) => {
  const props = useFieldControlProps(rest);
  return (
    <textarea
      className={cn(
        'w-full p-3 border border-border-control rounded-surface text-size-sm leading-6 text-primary bg-raised placeholder:text-placeholder',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
        'disabled:border-default disabled:bg-surface-disabled disabled:text-disabled disabled:cursor-not-allowed',
        'aria-invalid:border-error-fg',
        className,
      )}
      {...props}
      ref={ref}
    />
  );
});
