import { forwardRef, useRef } from 'react';
import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6';
import { IconButton } from './IconButton';
import { Input } from './Input';

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  'aria-label'?: string;
  disabled?: boolean;
  /** Applied to the root. */
  className?: string;
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  value, onChange, placeholder, 'aria-label': ariaLabel, disabled, className,
}, ref) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const setRefs = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <Input
      ref={setRefs}
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      disabled={disabled}
      className={className}
      leading={<FaMagnifyingGlass aria-hidden />}
      trailing={(
        // Always rendered so Input keeps its wrapper; a conditional node would remount the input and drop focus mid-typing
        <IconButton
          aria-label="Clear search"
          hidden={!value}
          disabled={disabled}
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          className="-mr-1.5"
        >
          <FaXmark aria-hidden />
        </IconButton>
      )}
    />
  );
});
SearchInput.displayName = 'SearchInput';
