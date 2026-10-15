import { forwardRef } from 'react';
import { useFieldControlProps } from './Field';
import { cn } from './utils';

export type InputProps = {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
} & React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> &
React.RefAttributes<HTMLInputElement>;

const TEXT_INPUT_STYLES = [
  'w-full h-11 px-3 rounded-surface border border-border-control bg-raised',
  'text-size-sm leading-6 text-primary placeholder:text-placeholder',
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
  'disabled:border-default disabled:bg-surface-disabled disabled:text-disabled disabled:cursor-not-allowed',
  'aria-invalid:border-error-fg',
  '[&::-webkit-search-cancel-button]:appearance-none',
];

export const Input: React.ForwardRefExoticComponent<InputProps> = forwardRef((
  {
    className, leading, trailing, type = 'text', ...rest
  },
  ref,
) => {
  const props = useFieldControlProps(rest);
  const input = (
    <input
      {...props}
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
});
