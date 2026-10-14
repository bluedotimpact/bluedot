/**
 * Badge like:
 * ----------
 * |  NOW   |
 * ----------
 * |  LIVE  |
 * ----------
 *
 * `compact` fits the 44px calendar square on mobile, sized like the month/day badge it replaces.
 */
const LiveBadge = ({ compact = false }: { compact?: boolean }) => (compact ? (
  <>
    {/* eslint-disable-next-line @bluedot/custom/no-arbitrary-text-size */}
    <div className="flex flex-1 items-center justify-center text-center text-[11px] font-bold leading-none text-bluedot-navy sm:px-3 sm:py-1 sm:text-size-xs sm:leading-relaxed">NOW</div>
    {/* eslint-disable-next-line @bluedot/custom/no-arbitrary-text-size */}
    <div className="flex h-4 items-center justify-center bg-bluedot-normal text-[10px] font-semibold leading-none text-white sm:h-auto sm:py-[3px] sm:text-size-xxs sm:leading-normal">LIVE</div>
  </>
) : (
  <>
    <div className="flex flex-1 items-center justify-center px-3 py-1 text-center text-size-xs font-bold leading-relaxed text-bluedot-navy">NOW</div>
    <div className="bg-bluedot-normal py-[3px] text-center text-size-xxs font-semibold leading-normal text-white">LIVE</div>
  </>
));

export default LiveBadge;
