// The "NOW / LIVE" rows of a badge tile, with no box of its own. Place it directly inside a
// flex-col badge box and it fills that box (the NOW row grows), so the live tile matches the
// dimensions of its non-live date sibling in each context (DiscussionListRow, NextDiscussionCard).
const LiveBadge = () => (
  <>
    <div className="flex flex-1 items-center justify-center px-3 py-1 text-center text-size-xs font-bold leading-[22px] text-bluedot-navy">NOW</div>
    <div className="bg-bluedot-normal py-[3px] text-center text-size-xxs font-semibold leading-[16px] text-white">LIVE</div>
  </>
);

export default LiveBadge;
