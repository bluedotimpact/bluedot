import { useRef } from 'react';
import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6';
import { IconButton } from './IconButton';
import { Input } from './Input';

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  'aria-label'?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Applied to the root. */
  className?: string;
};

export const SearchInput = ({
  value, onChange, placeholder, 'aria-label': ariaLabel, disabled, autoFocus, className,
}: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Input
      ref={inputRef}
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      disabled={disabled}
      autoFocus={autoFocus}
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
};
