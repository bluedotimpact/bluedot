import { useContext } from 'react';
import type { ReactNode, SelectHTMLAttributes } from 'react';
import {
  Button,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
} from 'react-aria-components';
import { FaChevronDown, FaCheck } from 'react-icons/fa6';
import { FieldContext, useFieldControlProps } from './Field';
import { cn } from './utils';

export type SelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

// Only the native attributes react-aria actually forwards
type NativeSelectProps = Pick<
  SelectHTMLAttributes<HTMLSelectElement>,
  'id' | 'name' | 'required' | 'disabled' | 'autoComplete'
  | 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid'
>;

export type SelectProps = NativeSelectProps & {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** `ghost` drops the field chrome for title-style switchers (e.g. modal headers) */
  variant?: 'default' | 'ghost';
  className?: string;
};

const TRIGGER_STYLES = {
  default: [
    'w-full h-11 px-3 rounded-surface border border-border-control bg-raised',
    'text-size-sm leading-6 text-primary',
    'hover:bg-tint',
    'group-data-[disabled]:border-default group-data-[disabled]:bg-surface-disabled group-data-[disabled]:text-disabled group-data-[disabled]:hover:bg-surface-disabled',
    'group-data-[invalid]:border-error-fg',
  ],
  ghost: [
    'w-fit h-11 px-3 rounded-surface',
    'text-size-md font-medium text-primary',
    'hover:bg-tint',
    'group-data-[disabled]:text-disabled group-data-[disabled]:hover:bg-transparent',
  ],
};

export const Select = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  variant = 'default',
  className,
  disabled,
  ...nativeProps
}: SelectProps) => {
  const { required, 'aria-invalid': ariaInvalid, ...rest } = useFieldControlProps(nativeProps);
  // react-aria puts `aria-labelledby` on the trigger, which beats the Field's `<label for>`.
  const fieldLabelId = useContext(FieldContext)?.labelId;
  const hasOwnName = rest['aria-label'] !== undefined || rest['aria-labelledby'] !== undefined;
  const selectedOption = options.find((op) => op.value === value);
  // A value with no matching option (e.g. a stored timezone no longer in the list) should still show
  const showsPlaceholder = !selectedOption && !value;
  const isInvalid = ariaInvalid === true || ariaInvalid === 'true';

  return (
    <AriaSelect
      {...rest}
      aria-labelledby={hasOwnName ? rest['aria-labelledby'] : fieldLabelId}
      selectedKey={value ?? null}
      onSelectionChange={(key) => {
        if (key !== null) onChange?.(String(key));
      }}
      isRequired={required}
      isDisabled={disabled}
      isInvalid={isInvalid || undefined}
      className={cn('group flex flex-col', variant === 'ghost' ? 'w-fit' : 'w-full', className)}
    >
      <Button
        className={cn(
          'flex items-center gap-2 text-left cursor-pointer transition-colors',
          'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
          'group-data-[disabled]:cursor-not-allowed',
          TRIGGER_STYLES[variant],
        )}
      >
        <SelectValue className={cn('flex-1 min-w-0 truncate', showsPlaceholder && 'text-placeholder group-data-[disabled]:text-disabled')}>
          {selectedOption?.label ?? (showsPlaceholder ? placeholder : value)}
        </SelectValue>
        <FaChevronDown
          className="size-4 shrink-0 text-secondary transition-transform group-data-[open]:rotate-180 group-data-[disabled]:text-disabled"
          aria-hidden="true"
        />
      </Button>
      <Popover
        placement="bottom start"
        offset={8}
        maxHeight={400}
        className={cn(
          'w-(--trigger-width) rounded-surface border border-default bg-raised shadow-md overflow-y-auto',
          // ghost triggers are only as wide as the selected label; let the menu grow to its widest option
          variant === 'ghost' && 'min-w-max',
        )}
      >
        <ListBox className="flex flex-col outline-none">
          {options.map((option) => (
            <ListBoxItem
              key={option.value}
              id={option.value}
              textValue={typeof option.label === 'string' ? option.label : option.value}
              isDisabled={option.disabled}
              className={cn(
                'flex items-center justify-between gap-3 min-h-11 px-3 py-2.5 text-size-sm text-primary cursor-pointer outline-none transition-colors',
                'data-[hovered]:bg-tint data-[focused]:bg-tint',
                'data-[selected]:bg-accent-subtle data-[selected]:text-accent',
                'data-[disabled]:text-disabled data-[disabled]:cursor-not-allowed data-[disabled]:hover:bg-transparent',
              )}
            >
              {({ isSelected }) => (
                <>
                  <span className="min-w-0">{option.label}</span>
                  {isSelected && <FaCheck className="size-3.5 shrink-0" aria-hidden="true" />}
                </>
              )}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
};
