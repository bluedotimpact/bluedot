import React from 'react';
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
  return (
    <AriaSelect
      className={clsx('flex flex-col gap-2', className)}
      isDisabled={disabled}
      selectedKey={value}
      onSelectionChange={(key) => onChange?.(key as string)}
      name={name}
      placeholder={placeholder}
    >
      {label && <Label className="text-size-sm font-medium">{label}</Label>}
      <Button className={clsx(
        'flex items-center px-3 gap-2 w-fit h-[36px] bg-[rgba(0,17,77,0.05)] rounded-[6px] hover:bg-[rgba(0,17,77,0.1)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-bluedot-normal transition-colors',
        'data-[pressed]:bg-[rgba(0,17,77,0.1)]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[rgba(0,17,77,0.05)]',
        buttonClassName,
      )}
      >
        {icon && <span className={clsx('size-4', disabled ? 'text-gray-400' : 'text-bluedot-darker')}>{icon}</span>}
        <SelectValue className={clsx('font-medium text-[13px] leading-[22px] text-left', disabled ? 'text-gray-500' : 'text-bluedot-darker')} />
        <ChevronDownIcon className={clsx('size-[14px]', disabled ? 'opacity-50' : '')} />
      </Button>
      <Popover className="w-[var(--trigger-width)] min-w-max max-h-60 overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5 -mt-1">
        <ListBox className="outline-none p-1 w-full">
          {options.map((option) => (
            <ListBoxItem
              key={option.value}
              id={option.value}
              textValue={option.label}
              className="flex items-center gap-2 cursor-default select-none py-2.5 px-4 outline-none hover:bg-[rgba(0,85,255,0.05)] focus:bg-[rgba(0,85,255,0.05)] focus:text-bluedot-darker w-full"
            >
              {option.icon && <span className="size-4">{option.icon}</span>}
              <span className="flex-1 font-medium text-[13px] leading-[22px]">{option.label}</span>
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
};
