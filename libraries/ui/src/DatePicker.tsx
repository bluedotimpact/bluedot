import { isValid, parse } from 'date-fns';
import { useId, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { LuChevronsUpDown } from 'react-icons/lu';
import { cn } from './utils';

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

  const handleInputBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Try parsing common date formats
    const formats = ['MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd', 'M/d/yyyy', 'd/M/yyyy'];

    for (const format of formats) {
      const parsedDate = parse(newValue, format, new Date());
      if (isValid(parsedDate)) {
        onChange?.(parsedDate);
        setMonth(parsedDate);
        return;
      }
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
            left: '50vw',
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
        />
      </div>
    </div>
  );
};
