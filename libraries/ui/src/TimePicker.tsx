import {
  DateInput, DateSegment,
  Label,
  TimeField,
  TimeValue,
} from 'react-aria-components';
// eslint-disable-next-line import/no-extraneous-dependencies
import { parseTime } from '@internationalized/date';
import { cn } from './utils';

type TimePickerProps = {
  label?: string;
  hideLabel?: boolean;
  value?: Date | null;
  onChange?: (value: Date | null) => void;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
};

export const TimePicker = ({
  label = 'Time',
  hideLabel = false,
  value,
  onChange,
  className,
  labelClassName,
  inputClassName,
}: TimePickerProps) => {
  // Convert Date to TimeValue via HH:mm format
  const timeValue = value
    ? parseTime(`${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`)
    : null;

  // Convert TimeValue to Date object in onChange
  const handleChange = (newValue: TimeValue | null) => {
    if (newValue) {
      const date = new Date();
      date.setHours(newValue.hour, newValue.minute, 0, 0);
      onChange?.(date);
    } else {
      onChange?.(null);
    }
  };

  return (
    <TimeField
      className={cn('group flex w-[200px] flex-col gap-1', className)}
      value={timeValue}
      onChange={handleChange}
      aria-label={hideLabel ? label : undefined}
    >
      {!hideLabel && <Label className={cn('cursor-default text-black', labelClassName)}>{label}</Label>}
      <DateInput
        className={cn(
          'flex rounded-lg border border-gray-200 bg-white/90 px-3 py-2 text-gray-700 ring-black transition focus-within:bg-white focus-visible:ring-2',
          inputClassName,
        )}
      >
        {(segment) => (
          <DateSegment
            segment={segment}
            className="rounded-xs px-0.5 tabular-nums caret-transparent outline-hidden placeholder-shown:italic focus:bg-bluedot-normal focus:text-white"
          />
        )}
      </DateInput>
    </TimeField>
  );
};
