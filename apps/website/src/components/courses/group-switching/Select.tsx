import { cn } from '@bluedot/ui';
import clsx from 'clsx'; // TODO replace all with cn
import type { Key, ReactNode } from 'react';
import {
  Button,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
} from 'react-aria-components';
import { FaChevronDown, FaCheck } from 'react-icons/fa6';

type SelectProps = {
  options: { value: string; label: ReactNode; disabled?: boolean }[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
};

// TODO add tests, move to ui/Select

const Select = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className,
}: SelectProps) => {
  const selectedOption = options.find((op) => op.value === value);

  const handleSelectionChange = (key: Key | null) => {
    if (key !== null) {
      onChange?.(key as string);
    }
  };

  return (
    <AriaSelect
      selectedKey={value}
      onSelectionChange={handleSelectionChange}
      className={cn('w-full flex flex-col bg-white border border-color-divider rounded-lg transition-all', className)}
    >
      {({ isOpen }) => (
        <>
          <Button
            className="w-full gap-3 flex justify-between p-4 items-center cursor-pointer text-left transition-all"
          >
            <span className="text-size-sm text-[#13132E] flex-1 min-w-0">
              {selectedOption?.label || value || placeholder}
            </span>
            <FaChevronDown
              className={clsx('size-3 -translate-y-px flex-shrink-0 transition-transform', isOpen ? 'rotate-180' : 'rotate-0')}
              aria-hidden="true"
            />
          </Button>
          <Popover
            placement="bottom"
            offset={8}
            className="w-(--trigger-width) bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-color-divider overflow-hidden"
          >
            <ListBox className="flex flex-col max-h-60 overflow-y-auto outline-none">
              {options.map((option) => (
                <ListBoxItem
                  key={option.value}
                  id={option.value}
                  textValue={(typeof option.label === 'string' ? option.label : option.value)}
                  isDisabled={option.disabled}
                  className={cn(
                    'p-4 text-size-sm transition-colors focus:bg-blue-50 focus:text-blue-900 outline-none flex items-center justify-between gap-3',
                    option.disabled ? 'opacity-50 cursor-not-allowed' : ' hover:bg-gray-100 cursor-pointer',
                  )}
                >
                  <span>{option.label}</span>
                  {option.value === value && (
                    <FaCheck className="size-3 text-blue-600 flex-shrink-0" aria-hidden="true" />
                  )}
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </>
      )}
    </AriaSelect>
  );
};

export default Select;
