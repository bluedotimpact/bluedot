import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  DateInput,
  DatePicker as AriaDatePicker,
  DateSegment,
  DateValue,
  Dialog,
  Group,
  Heading,
  Label,
  Popover,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
} from 'react-aria-components';
import type { ButtonProps, PopoverProps } from 'react-aria-components';
import { LuChevronsUpDown, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
// eslint-disable-next-line import/no-extraneous-dependencies
import { parseDate } from '@internationalized/date';
import { cn } from './utils';

type DatePickerProps = {
  label?: string;
  hideLabel?: boolean;
  value?: Date | null;
  onChange?: (value: Date | null) => void;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
  popoverClassName?: string;
};

export const DatePicker = ({
  label = 'Date',
  hideLabel = false,
  value,
  onChange,
  className,
  labelClassName,
  inputClassName,
  buttonClassName,
  popoverClassName,
}: DatePickerProps) => {
  // Convert JS Date to DatePicker's expected DateValue
  const dateValue = value ? parseDate(value.toISOString().split('T')[0]!) : null;

  const handleChange = (newValue: DateValue | null) => {
    // Convert DateValue to JS Date object
    const date = newValue ? new Date(newValue.toString()) : null;
    onChange?.(date);
  };

  return (
    <AriaDatePicker
      className={cn('group flex w-[200px] flex-col gap-1', className)}
      value={dateValue}
      onChange={handleChange}
      aria-label={hideLabel ? label : undefined}
    >
      {!hideLabel && (
        <Label className={cn('cursor-default text-black', labelClassName)}>{label}</Label>
      )}
      <Group className={cn('flex rounded-lg border border-gray-200 bg-white/90 pl-3 text-gray-700 ring-black transition group-open:bg-white focus-within:bg-white focus-visible:ring-2', inputClassName)}>
        <DateInput className="flex flex-1 py-2">
          {(segment) => (
            <DateSegment
              segment={segment}
              className="rounded-xs px-0.5 tabular-nums caret-transparent outline-hidden placeholder-shown:italic focus:bg-bluedot-normal focus:text-white"
            />
          )}
        </DateInput>
        <Button className={cn('pressed:bg-purple-100 flex items-center rounded-r-lg border-0 border-l border-solid border-l-purple-200 bg-transparent px-3 text-gray-700 ring-black outline-hidden transition focus-visible:ring-2', buttonClassName)}>
          <LuChevronsUpDown className="size-4" />
        </Button>
      </Group>
      <CalendarPopover popoverClassName={popoverClassName}>
        <Dialog className="p-6 text-gray-600">
          <Calendar>
            <header className="flex w-full items-center gap-1 px-1 pb-4 font-serif">
              <Heading className="ml-2 flex-1 text-2xl font-semibold" />
              <RoundButton slot="previous">
                <LuChevronLeft />
              </RoundButton>
              <RoundButton slot="next">
                <LuChevronRight />
              </RoundButton>
            </header>
            <CalendarGrid className="border-separate border-spacing-1">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="text-size-xs font-semibold text-gray-500">{day}</CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell
                    date={date}
                    className="outside-month:text-gray-300 pressed:bg-gray-200 selected:bg-bluedot-normal selected:text-white flex size-9 cursor-default items-center justify-center rounded-full ring-bluedot-normal ring-offset-2 outline-hidden hover:bg-gray-100 focus-visible:ring-3"
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </CalendarPopover>
    </AriaDatePicker>
  );
};

const RoundButton = (props: ButtonProps) => {
  return (
    <Button
      {...props}
      className="pressed:bg-gray-200 flex size-9 cursor-default items-center justify-center rounded-full border-0 bg-transparent text-gray-600 ring-bluedot-normal ring-offset-2 outline-hidden hover:bg-gray-100 focus-visible:ring-3"
    />
  );
};

const CalendarPopover = ({ popoverClassName, ...props }: PopoverProps & { popoverClassName?: string }) => {
  return (
    <Popover
      {...props}
      className={({ isEntering, isExiting }) => cn(
        'overflow-auto rounded-lg bg-white ring-1 ring-black/10 drop-shadow-lg',
        isEntering && 'animate-in fade-in placement-bottom:slide-in-from-top-1 placement-top:slide-in-from-bottom-1 duration-200 ease-out',
        isExiting && 'animate-out fade-out placement-bottom:slide-out-to-top-1 placement-top:slide-out-to-bottom-1 duration-150 ease-in',
        popoverClassName,
      )}
    />
  );
};
