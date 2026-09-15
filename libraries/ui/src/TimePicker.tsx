import {
  DateInput, DateSegment, Label, TimeField,
} from 'react-aria-components';
import { Time } from '@internationalized/date';
import { cn } from './utils';

export type TimePickerProps = {
  label?: string;
  timeValue?: Date;
  onTimeChange?: (value?: Date) => void;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
};

export const TimePicker = ({
  label,
  timeValue,
  onTimeChange,
  disabled,
  className,
  labelClassName,
  inputClassName,
}: TimePickerProps) => {
  // Convert Date to Time object
  const time = timeValue ? new Time(timeValue.getHours(), timeValue.getMinutes()) : null;

  // Convert Time object to Date object in onChange
  const handleChange = (newValue: Time | null) => {
    if (!onTimeChange) {
      return;
    }

    if (newValue) {
      const date = timeValue ? new Date(timeValue) : new Date();
      date.setHours(newValue.hour, newValue.minute, 0, 0);
      onTimeChange(date);
    } else {
      onTimeChange(undefined);
    }
  };

  return (
    <TimeField
      className={cn('group flex w-[200px] flex-col gap-1', className)}
      value={time}
      onChange={handleChange}
      isDisabled={disabled}
    >
      {label && <Label className={cn('cursor-default text-black', labelClassName)}>{label}</Label>}
      <DateInput
        className={({ isFocusWithin, isDisabled }) => cn(
          'flex h-11 items-center rounded-surface border border-subtle bg-raised px-3 text-primary transition',
          isFocusWithin && 'border-accent ring-1 ring-accent',
          isDisabled && 'bg-tint text-disabled',
          inputClassName,
        )}
      >
        {(segment) => (
          <DateSegment
            segment={segment}
            className={({ isPlaceholder, isFocused, isDisabled }) => cn(
              'rounded-surface px-0.5 tabular-nums caret-transparent outline-hidden',
              isPlaceholder && !isDisabled && 'text-placeholder',
              isFocused && 'bg-accent text-on-dark',
            )}
          />
        )}
      </DateInput>
    </TimeField>
  );
};
