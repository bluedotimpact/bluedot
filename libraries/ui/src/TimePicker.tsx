import {
  DateInput, DateSegment, Label, TimeField,
} from 'react-aria-components';
import { Time } from '@internationalized/date';
import { cn } from './utils';

export type TimePickerProps = {
  label?: string;
  timeValue?: Date;
  onTimeChange?: (value?: Date) => void;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
};

export const TimePicker = ({
  label,
  timeValue,
  onTimeChange,
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
    >
      {label && <Label className={cn('cursor-default text-black', labelClassName)}>{label}</Label>}
      <DateInput
        className={cn(
          'flex rounded-lg border border-gray-200 bg-white/90 px-3 py-2 text-gray-700 ring-black transition focus-within:bg-white focus-visible:ring-2',
          inputClassName,
        )}
      >
        {(segment) => (
          <DateSegment
            segment={segment}
            className="focus:bg-bluedot-normal rounded-xs px-0.5 tabular-nums caret-transparent outline-hidden placeholder-shown:italic focus:text-white"
          />
        )}
      </DateInput>
    </TimeField>
  );
};
