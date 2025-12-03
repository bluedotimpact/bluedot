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
              className="rounded-xs px-0.5 tabular-nums caret-transparent outline-hidden placeholder-shown:italic focus:bg-violet-700 focus:text-white"
            />
          )}
        </DateInput>
        <Button className="pressed:bg-purple-100 flex items-center rounded-r-lg border-0 border-l border-solid border-l-purple-200 bg-transparent px-3 text-gray-700 ring-black outline-hidden transition focus-visible:ring-2">
          <LuChevronsUpDown className="size-4" />
        </Button>
      </Group>
      <MyPopover>
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
                    className="outside-month:text-gray-300 pressed:bg-gray-200 selected:bg-violet-700 selected:text-white flex size-9 cursor-default items-center justify-center rounded-full ring-violet-600/70 ring-offset-2 outline-hidden hover:bg-gray-100 focus-visible:ring-3"
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
      className="pressed:bg-gray-200 flex size-9 cursor-default items-center justify-center rounded-full border-0 bg-transparent text-gray-600 ring-violet-600/70 ring-offset-2 outline-hidden hover:bg-gray-100 focus-visible:ring-3"
    />
  );
};

const MyPopover = (props: PopoverProps) => {
  return (
    <Popover
      {...props}
      className={({ isEntering, isExiting }) => `overflow-auto rounded-lg bg-white ring-1 ring-black/10 drop-shadow-lg ${
        isEntering
          ? 'animate-in fade-in placement-bottom:slide-in-from-top-1 placement-top:slide-in-from-bottom-1 duration-200 ease-out'
          : ''
      } ${
        isExiting
          ? 'animate-out fade-out placement-bottom:slide-out-to-top-1 placement-top:slide-out-to-bottom-1 duration-150 ease-in'
          : ''
      } `}
    />
  );
};
