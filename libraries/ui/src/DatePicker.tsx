import { format, isValid, parse } from 'date-fns';
import {
  useCallback, useEffect, useId, useRef, useState,
} from 'react';
import { FaChevronLeft, FaChevronRight, FaRegCalendar } from 'react-icons/fa6';
import {
  DayButton, DayPicker, type ChevronProps, type ClassNames, type DayButtonProps,
} from 'react-day-picker';
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

export type DatePickerProps = {
  label?: string;
  value?: Date;
  onChange?: (value?: Date) => void;
  disabled?: boolean;
  className?: string;
};

const ROUND_BUTTON_STYLES = 'flex cursor-pointer items-center justify-center rounded-full outline-none transition-colors hover:bg-tint focus-visible:ring-2 focus-visible:ring-focus';
const NAV_BUTTON_STYLES = cn(ROUND_BUTTON_STYLES, 'size-9');

const CALENDAR_CLASS_NAMES: Partial<ClassNames> = {
  months: 'relative',
  month: 'flex flex-col gap-3',
  nav: 'absolute inset-x-0 top-0 flex h-9 items-center justify-between',
  button_previous: NAV_BUTTON_STYLES,
  button_next: NAV_BUTTON_STYLES,
  month_caption: 'flex h-9 items-center justify-center text-size-xs font-medium',
  month_grid: 'border-collapse',
  weekday: 'h-5 w-11 text-size-xs font-medium text-secondary',
  day: 'p-0 text-center',
};

const CalendarChevron = ({ orientation, className }: ChevronProps) => {
  const Icon = orientation === 'left' ? FaChevronLeft : FaChevronRight;
  return <Icon className={cn('size-3.5', className)} aria-hidden="true" />;
};

// Wraps the library button (which moves DOM focus for arrow-key navigation) so that
// selected/today/outside precedence is explicit instead of depending on stylesheet order.
const CalendarDayButton = ({ modifiers, className, ...props }: DayButtonProps) => (
  <DayButton
    {...props}
    modifiers={modifiers}
    className={cn(
      ROUND_BUTTON_STYLES,
      'size-11',
      modifiers.outside && 'text-secondary',
      modifiers.today && 'text-accent ring-1 ring-inset ring-accent',
      modifiers.selected && 'bg-accent text-on-dark ring-0 hover:bg-accent',
      className,
    )}
  />
);

const CALENDAR_COMPONENTS = { Chevron: CalendarChevron, DayButton: CalendarDayButton };

export const DatePicker = ({
  label, value, onChange, disabled, className,
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

  // Close calendar when `disabled` changes to true
  useEffect(() => {
    if (disabled) {
      popoverRef.current?.hidePopover();
    }
  }, [disabled]);

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
    <div ref={triggerRef} className={cn('group relative flex w-[200px] flex-col gap-1', className)}>
      {label ? (
        <label htmlFor={inputId} className="text-black">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          'relative flex h-11 items-center rounded-surface border border-subtle bg-raised text-primary transition focus-within:border-accent focus-within:ring-1 focus-within:ring-accent group-has-[:popover-open]:border-accent group-has-[:popover-open]:ring-1 group-has-[:popover-open]:ring-accent',
          disabled && 'bg-tint text-disabled',
        )}
      >
        <input
          id={inputId}
          type="text"
          value={inputValue}
          disabled={disabled}
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
          className="size-full rounded-surface bg-transparent pr-10 pl-3 outline-none placeholder:text-placeholder disabled:cursor-not-allowed"
        />
        <button
          type="button"
          popoverTarget={popoverId}
          onClick={updatePopoverPosition}
          disabled={disabled}
          aria-label="Open calendar"
          className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-secondary outline-none disabled:cursor-not-allowed disabled:text-disabled"
        >
          <FaRegCalendar className="size-4" aria-hidden="true" />
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
        className="rounded-surface border border-subtle bg-raised p-4 drop-shadow-sm"
      >
        <DayPicker
          mode="single"
          selected={value}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          showOutsideDays
          components={CALENDAR_COMPONENTS}
          classNames={CALENDAR_CLASS_NAMES}
        />
      </div>
    </div>
  );
};
