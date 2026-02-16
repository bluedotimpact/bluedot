import { useState, type Key, type ReactNode } from 'react';
import {
  Button,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
} from 'react-aria-components';
import { FaChevronDown, FaCheck } from 'react-icons/fa6';
import { breakpoints, useAboveBreakpoint } from './hooks/useBreakpoint';
import { BottomDrawerModal } from './BottomDrawerModal';
import { cn } from './utils';

export type SelectProps = {
  options: { value: string; label: ReactNode; disabled?: boolean }[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
};

export const Select = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className,
  ariaLabel,
}: SelectProps) => {
  const selectedOption = options.find((op) => op.value === value);
  const isDesktop = useAboveBreakpoint(breakpoints.md);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (key: Key | null) => {
    if (key !== null) {
      onChange?.(key as string);
      setIsOpen(false);
    }
  };

  const listContent = (
    <ListBox className="flex flex-col w-full outline-none" onAction={handleSelect}>
      {options.map((option) => (
        <ListBoxItem
          key={option.value}
          id={option.value}
          textValue={typeof option.label === 'string' ? option.label : option.value}
          isDisabled={option.disabled}
          className={cn(
            'p-4 text-size-sm transition-colors focus:bg-blue-50 focus:text-blue-900 outline-none flex items-center justify-between gap-3',
            option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer',
          )}
        >
          <span>{option.label}</span>
          {option.value === value && (
            <FaCheck className="size-3 text-blue-600 flex-shrink-0" aria-hidden="true" />
          )}
        </ListBoxItem>
      ))}
    </ListBox>
  );

  return (
    <>
      <AriaSelect
        selectedKey={value}
        onSelectionChange={handleSelect}
        isOpen={isDesktop ? isOpen : false}
        onOpenChange={setIsOpen}
        aria-label={ariaLabel}
        className={cn('w-full flex flex-col bg-white border border-color-divider rounded-lg transition-all text-size-sm', className)}
      >
        <Button
          className="w-full gap-3 flex justify-between p-4 items-center cursor-pointer text-left transition-all"
          onPress={() => setIsOpen(true)}
        >
          <span className="text-bluedot-navy flex-1 min-w-0">
            {selectedOption?.label || value || placeholder}
          </span>
          <FaChevronDown
            className={cn('size-3 -translate-y-px flex-shrink-0 transition-transform', isOpen ? 'rotate-180' : 'rotate-0')}
            aria-hidden="true"
          />
        </Button>
        <Popover
          placement="bottom"
          offset={8}
          maxHeight={400}
          className="w-(--trigger-width) bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-color-divider overflow-hidden max-h-[400px] overflow-y-auto"
        >
          {listContent}
        </Popover>
      </AriaSelect>
      {isDesktop === false && (
        <BottomDrawerModal isOpen={isOpen} setIsOpen={setIsOpen} initialSize="fit-content">
          {listContent}
        </BottomDrawerModal>
      )}
    </>
  );
};
