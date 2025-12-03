import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  DateInput,
  DatePicker as AriaDatePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Label,
  Popover,
  CalendarGridBody, CalendarGridHeader, CalendarHeaderCell,
} from 'react-aria-components';
import type { ButtonProps, PopoverProps } from 'react-aria-components';
import { LuChevronsUpDown, LuChevronLeft, LuChevronRight } from "react-icons/lu";


export const DatePicker = () => {
  return (
    <AriaDatePicker className="group flex flex-col gap-1 w-[200px]">
      <Label className="text-white cursor-default">Date</Label>
      <Group className="flex rounded-lg bg-white/90 focus-within:bg-white group-open:bg-white transition pl-3 shadow-md text-gray-700 focus-visible:ring-2 ring-black">
        <DateInput className="flex flex-1 py-2">
          {(segment) => (
            <DateSegment
              segment={segment}
              className="px-0.5 tabular-nums outline-hidden rounded-xs focus:bg-violet-700 focus:text-white caret-transparent placeholder-shown:italic"
            />
          )}
        </DateInput>
        <Button className="outline-hidden px-3 flex items-center text-gray-700 transition border-0 border-solid border-l border-l-purple-200 bg-transparent rounded-r-lg pressed:bg-purple-100 focus-visible:ring-2 ring-black">
          <LuChevronsUpDown className="size-4" />
        </Button>
      </Group>
      <MyPopover>
        <Dialog className="p-6 text-gray-600">
          <Calendar>
            <header className="flex items-center gap-1 pb-4 px-1 font-serif w-full">
              <Heading className="flex-1 font-semibold text-2xl ml-2" />
              <RoundButton slot="previous">
                <LuChevronLeft />
              </RoundButton>
              <RoundButton slot="next">
                <LuChevronRight />
              </RoundButton>
            </header>
            <CalendarGrid className="border-spacing-1 border-separate">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="text-size-xs text-gray-500 font-semibold">
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell
                    date={date}
                    className="size-9 outline-hidden cursor-default rounded-full flex items-center justify-center outside-month:text-gray-300 hover:bg-gray-100 pressed:bg-gray-200 selected:bg-violet-700 selected:text-white focus-visible:ring-3 ring-violet-600/70 ring-offset-2"
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </MyPopover>
    </AriaDatePicker>
  );
};

const RoundButton = (props: ButtonProps) => {
  return (
    <Button
      {...props}
      className="size-9 outline-hidden cursor-default bg-transparent text-gray-600 border-0 rounded-full flex items-center justify-center hover:bg-gray-100 pressed:bg-gray-200 focus-visible:ring-3 ring-violet-600/70 ring-offset-2"
    />
  );
};

const MyPopover = (props: PopoverProps) => {
  return (
    <Popover
      {...props}
      className={({ isEntering, isExiting }) => `
        overflow-auto rounded-lg drop-shadow-lg ring-1 ring-black/10 bg-white
        ${
        isEntering
          ? 'animate-in fade-in placement-bottom:slide-in-from-top-1 placement-top:slide-in-from-bottom-1 ease-out duration-200'
          : ''
      }
        ${
        isExiting
          ? 'animate-out fade-out placement-bottom:slide-out-to-top-1 placement-top:slide-out-to-bottom-1 ease-in duration-150'
          : ''
      }
      `}
    />
  );
};
