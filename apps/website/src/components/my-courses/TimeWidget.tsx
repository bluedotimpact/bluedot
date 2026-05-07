import { formatDateMonthAndDay, formatTime12HourClock } from '../../lib/utils';

type TimeWidgetProps = {
  isLive: boolean;
  dateTimeSeconds: number;
};

const TimeWidget = ({ isLive, dateTimeSeconds }: TimeWidgetProps) => (
  <div className="flex shrink-0 min-w-[85px] flex-col items-stretch overflow-hidden rounded-[5px] border border-color-divider">
    {isLive ? (
      <>
        <div className="px-3 py-1 text-center text-size-xs font-bold leading-[22px] text-bluedot-navy">NOW</div>
        <div className="bg-bluedot-normal py-[3px] text-center text-size-xxs font-semibold leading-[16px] text-white">LIVE</div>
      </>
    ) : (
      <div className="px-3 py-[7px] text-center text-bluedot-navy" aria-hidden>
        <div className="text-size-xs font-semibold leading-[22px]">{formatDateMonthAndDay(dateTimeSeconds)}</div>
        <div className="text-size-xxs font-medium leading-[16px] text-gray-500">{formatTime12HourClock(dateTimeSeconds)}</div>
      </div>
    )}
  </div>
);

export default TimeWidget;
