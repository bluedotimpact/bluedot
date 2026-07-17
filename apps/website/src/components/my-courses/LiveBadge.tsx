/**
 * Badge like:
 * ----------
 * |  NOW   |
 * ----------
 * |  LIVE  |
 * ----------
 */
const LiveBadge = () => (
  <>
    <div className="flex flex-1 items-center justify-center px-3 py-1 text-center text-size-xs font-bold leading-relaxed text-bluedot-navy">NOW</div>
    <div className="bg-bluedot-normal py-[3px] text-center text-size-xxs font-semibold leading-normal text-white">LIVE</div>
  </>
);

export default LiveBadge;
