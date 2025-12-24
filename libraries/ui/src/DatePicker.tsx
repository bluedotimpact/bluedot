import { isValid, parse } from 'date-fns';
import { useId, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
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
        case 'day': return 'dd';
        case 'month': return 'MM';
        case 'year': return 'yyyy';
        case 'literal': return part.value;
        default: return '';
      }
    })
    .join('');
};

export type DatePickerProps = {
  label?: string;
  hideLabel?: boolean;
  value?: Date;
  onChange?: (value: Date) => void;
  className?: string;
};

export const DatePicker = ({
  label = 'Date', hideLabel = false, value, onChange, className,
}: DatePickerProps) => {
  const [inputValue, setInputValue] = useState(value ? value.toLocaleDateString() : '');
  const [month, setMonth] = useState<Date>(value ?? new Date());
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const popoverId = useId();
  const format = getLocaleDateFormat();

  const handleInputBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const parsedDate = parse(newValue, format, new Date());
    if (isValid(parsedDate)) {
      onChange?.(parsedDate);
      setMonth(parsedDate);
    }
  };

  const handleSelect = (date?: Date) => {
    if (date) {
      onChange?.(date);
      setInputValue(date.toLocaleDateString());
      setMonth(date);
    }
    popoverRef.current?.hidePopover();
  };

  return (
    <div className={cn('group relative flex w-[200px] flex-col gap-1', className)}>
      {!hideLabel ? (
        <label htmlFor={inputId} className="cursor-default text-black">
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
          onClick={() => value === undefined && popoverRef.current?.showPopover()}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleInputBlur}
          placeholder="Select date..."
          aria-label={hideLabel ? label : undefined}
          style={{ anchorName: `--${popoverId}` } as React.CSSProperties}
          className="w-full rounded-lg bg-transparent py-2 pr-9 pl-3 outline-none placeholder:italic"
        />
        <button
          type="button"
          popoverTarget={popoverId}
          aria-label="Open calendar"
          className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-gray-400 outline-none"
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
            positionAnchor: `--${popoverId}`,
            top: 'anchor(bottom)',
            left: 'anchor(center)',
            transform: 'translateX(-50%)',
            marginTop: '8px',
          } as React.CSSProperties
        }
        className="overflow-auto rounded-lg bg-white p-4 ring-1 ring-black/10 drop-shadow-lg"
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
          }}
        />
      </div>
    </div>
  );
};
