import clsx from 'clsx';
import { useState, type Key } from 'react';
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Select as AriaSelect,
} from 'react-aria-components';
import { FaChevronDown, FaCheck } from 'react-icons/fa6';

type SelectProps = {
  label: string;
  options: { value: string; label: string; disabled?: boolean }[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

const Select = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((op) => op.value === value);

  const handleSelectionChange = (key: Key | null) => {
    if (key !== null) {
      onChange?.(key as string);
      setIsOpen(false);
    }
  };

  return (
    <AriaSelect
      selectedKey={value}
      aria-label={`Select ${label}`}
      onSelectionChange={handleSelectionChange}
      className="w-full flex flex-col bg-white border border-color-divider rounded-lg transition-all"
    >
      <Button
        className="w-full flex border-none justify-between px-4 py-3 items-center cursor-pointer text-left"
        onPress={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <Label className="text-size-xs font-medium text-gray-500 flex-shrink-0">
            {label}
          </Label>
          {!isOpen && (
            <div className="text-size-sm text-gray-900">
              {selectedOption?.label || value || placeholder}
            </div>
          )}
        </div>
        <FaChevronDown
          className={`size-3 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </Button>
      {isOpen && (
        <ListBox className="flex flex-col px-4 pb-3 gap-1 max-h-60 overflow-y-auto outline-none">
          {options.map((option) => (
            <ListBoxItem
              key={option.value}
              id={option.value}
              textValue={option.label}
              isDisabled={option.disabled}
              className={clsx(
                'px-3 py-2 gap-3 text-size-sm rounded transition-colors hover:bg-gray-50 focus:bg-blue-50 focus:text-blue-900 outline-none flex items-center',
                option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              )}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <FaCheck className="size-3 text-blue-600" aria-hidden="true" />
              )}
            </ListBoxItem>
          ))}
        </ListBox>
      )}
    </AriaSelect>
  );
};

export default Select;
