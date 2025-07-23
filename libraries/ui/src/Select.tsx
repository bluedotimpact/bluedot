import React, { useState } from 'react';
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
} from 'react-aria-components';
import clsx from 'clsx';

export type SelectProps = {
  label?: string;
  icon?: React.ReactNode;
  placeholder?: string;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
};

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    className={className}
  >
    <path
      d="M3.5 5.25L7 8.75L10.5 5.25"
      stroke="#00114D"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Style configurations for consistent theming
const styles = {
  button: {
    base: 'flex items-center px-3 py-[10px] gap-2 w-fit h-[42px] bg-[rgba(0,85,255,0.05)] rounded-md focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-bluedot-normal transition-colors',
    hover: 'hover:bg-[rgba(0,85,255,0.1)]',
    active: 'data-[pressed]:bg-[rgba(0,17,77,0.15)] data-[expanded]:bg-[rgba(0,17,77,0.15)] aria-expanded:bg-[rgba(0,17,77,0.15)]',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[rgba(0,85,255,0.05)]',
  },
  text: {
    base: 'font-medium text-[13px] leading-[22px]',
    normal: 'text-bluedot-darker',
    disabled: 'text-gray-500',
  },
  icon: {
    base: 'size-4',
    normal: 'text-bluedot-darker',
    disabled: 'text-gray-400',
  },
  listItem: 'flex items-center gap-2 cursor-default select-none py-2.5 px-4 outline-none hover:bg-[rgba(0,85,255,0.05)] focus:bg-[rgba(0,85,255,0.05)] focus:text-bluedot-darker w-full',
  popover: 'w-[var(--trigger-width)] min-w-max max-h-60 overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5 -mt-1',
};

export const Select: React.FC<SelectProps> = ({
  label,
  icon,
  placeholder = 'Select an option',
  options,
  className,
  buttonClassName,
  disabled,
  value,
  onChange,
  name,
}) => {
  // Handle controlled/uncontrolled state
  const [internalValue, setInternalValue] = useState<string | undefined>(value);
  const selectedValue = value !== undefined ? value : internalValue;
  const selectedOption = options.find(opt => opt.value === selectedValue);
  
  // Update both internal state and call onChange callback
  const handleChange = (key: React.Key | null) => {
    if (key !== null) {
      const newValue = key as string;
      setInternalValue(newValue);
      onChange?.(newValue);
    }
  };
  
  return (
    <AriaSelect
      className={clsx('flex flex-col gap-2', className)}
      isDisabled={disabled}
      selectedKey={selectedValue}
      onSelectionChange={handleChange}
      name={name}
      placeholder={placeholder}
    >
      {label && <Label className="text-size-sm font-medium">{label}</Label>}
      <Button className={clsx(
        styles.button.base,
        styles.button.hover,
        styles.button.active,
        styles.button.disabled,
        buttonClassName,
      )}
      >
        <SelectValue className={clsx(styles.text.base, 'text-left', disabled ? styles.text.disabled : styles.text.normal)}>
          {({ isPlaceholder }) => {
            // Determine which icon to show: selected option's icon or placeholder icon
            const displayIcon = selectedOption?.icon || (isPlaceholder && icon);
            const displayText = selectedOption?.label || placeholder;
            
            // Render icon + text if icon exists
            if (displayIcon) {
              return (
                <div className="flex items-center gap-2">
                  <span className={clsx(styles.icon.base, disabled ? styles.icon.disabled : styles.icon.normal)}>
                    {displayIcon}
                  </span>
                  <span>{displayText}</span>
                </div>
              );
            }
            return displayText;
          }}
        </SelectValue>
        <ChevronDownIcon className={clsx('size-[14px]', disabled && 'opacity-50')} />
      </Button>
      <Popover className={styles.popover}>
        <ListBox className="outline-none py-1 w-full">
          {/* Render each option with optional icon */}
          {options.map((option) => (
            <ListBoxItem
              key={option.value}
              id={option.value}
              textValue={option.label}
              className={styles.listItem}
            >
              <div className="flex items-center gap-2 w-full">
                {option.icon && <span className="size-4 flex-shrink-0">{option.icon}</span>}
                <span className={clsx('flex-1', styles.text.base)}>{option.label}</span>
              </div>
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
};