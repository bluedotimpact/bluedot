import { format, isValid, parse } from 'date-fns';
import {
  useCallback, useEffect, useId, useRef, useState,
} from 'react';
import { DayPicker, type ClassNames } from 'react-day-picker';
import 'react-day-picker/style.css';
import { LuChevronsUpDown } from 'react-icons/lu';
import { cn } from './utils';

// Utility function to get the locale-specific date format of the user
// e.g. "MM/dd/yyyy" for US, "dd/MM/yyyy" for UK, etc.
export const getLocaleDateFormat = (): string => {
  const parts = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(2000, 11, 31));

  return parts
    .map((part) => {
      switch (part.type) {
        case 'day':
          return 'dd';
        case 'month':
          return 'MM';
        case 'year':
          return 'yyyy';
        case 'literal':
          return part.value;
        default:
          return '';
      }
    })
    .join('');
};

type DatePickerClassNames = {
  root?: string;
  label?: string;
  input?: string;
  button?: string;
  popover?: string;
  calendar?: Partial<ClassNames>;
};

export type DatePickerProps = {
  label?: string;
  value?: Date;
  onChange?: (value?: Date) => void;
  classNames?: DatePickerClassNames;
};

export const DatePicker = ({
  label, value, onChange, classNames,
}: DatePickerProps) => {
  const localeFormat = getLocaleDateFormat();
  const [inputValue, setInputValue] = useState(value ? format(value, localeFormat) : '');
  const [month, setMonth] = useState<Date>(value ?? new Date());
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const popoverId = useId();

  useEffect(() => {
    setInputValue(value ? format(value, localeFormat) : '');
    if (value) {
      setMonth(value);
    }
  }, [value, localeFormat]);

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!newValue) {
      onChange?.(undefined);
      return;
    }

    const parsedDate = parse(newValue, localeFormat, new Date());
    if (isValid(parsedDate)) {
      onChange?.(parsedDate);
    } else {
      // Reset to previous valid value if parsing fails
      setInputValue(value ? format(value, localeFormat) : '');
    }
  };

  const handleSelect = (date?: Date) => {
    onChange?.(date);
    popoverRef.current?.hidePopover();
  };

  const updatePopoverPosition = useCallback(() => {
    if (triggerRef.current && popoverRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const left = triggerRect.left + triggerRect.width / 2;

      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const popoverHeight = popoverRect.height || 332;

      // Position above if not enough space below and more space above
      const shouldPositionAbove = spaceBelow < popoverHeight && spaceAbove > spaceBelow;

      const top = shouldPositionAbove
        ? triggerRect.top - popoverHeight - 8
        : triggerRect.bottom + 8;

      popoverRef.current.style.top = `${top}px`;
      popoverRef.current.style.left = `${left}px`;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updatePopoverPosition);
    window.addEventListener('scroll', updatePopoverPosition, true);
    return () => {
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [updatePopoverPosition]);

  return (
    <div ref={triggerRef} className={cn('group relative flex w-[200px] flex-col gap-1', classNames?.root)}>
      {label ? (
        <label htmlFor={inputId} className={cn('text-black', classNames?.label)}>
          {label}
        </label>
      ) : null}
      <div className="relative rounded-lg border border-gray-200 bg-white/90 text-gray-700 transition focus-within:bg-white">
        <input
          id={inputId}
          type="text"
          value={inputValue}
          // Input field is editable only after a date has been selected
          readOnly={value === undefined}
          onClick={() => {
            if (value === undefined) {
              updatePopoverPosition();
              popoverRef.current?.togglePopover();
            }
          }}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleInputBlur}
          placeholder={localeFormat.toLowerCase()}
          aria-label={label ?? 'Select date'}
          className={cn(
            'w-full rounded-lg bg-transparent py-2 pr-9 pl-3 outline-none placeholder:italic',
            classNames?.input,
          )}
        />
        <button
          type="button"
          popoverTarget={popoverId}
          onClick={updatePopoverPosition}
          aria-label="Open calendar"
          className={cn(
            'absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-gray-400 outline-none',
            classNames?.button,
          )}
        >
          <LuChevronsUpDown className="size-4" />
        </button>
      </div>
      <div
        ref={popoverRef}
        id={popoverId}
        popover="auto"
        style={
          {
            position: 'fixed',
            transform: 'translateX(-50%)',
          } as React.CSSProperties
        }
        className={cn('overflow-auto rounded-lg bg-white p-4 ring-1 ring-black/10 drop-shadow-sm', classNames?.popover)}
      >
        <DayPicker
          mode="single"
          selected={value}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          showOutsideDays
          classNames={{
            chevron: 'fill-bluedot-normal',
            today: 'text-bluedot-normal',
            ...classNames?.calendar,
          }}
        />
      </div>
    </div>
  );
};
