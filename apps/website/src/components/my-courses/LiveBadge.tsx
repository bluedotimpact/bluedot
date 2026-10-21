/**
 * Badge like:
 * ----------
 * |  NOW   |
 * ----------
 * |  LIVE  |
 * ----------
 *
 * `compact` fits the 44px calendar square on mobile: no padding around NOW and a 16px LIVE band, like the month band.
 */
const LiveBadge = ({ compact = false }: { compact?: boolean }) => (
  <>
    <div className={`flex flex-1 items-center justify-center text-center text-size-xs font-bold leading-relaxed text-primary ${compact ? 'sm:px-3 sm:py-1' : 'px-3 py-1'}`}>NOW</div>
    <div className={`bg-accent text-center text-size-xxs font-semibold text-on-dark ${compact ? 'h-4 leading-4 sm:h-auto sm:py-[3px] sm:leading-normal' : 'py-[3px] leading-normal'}`}>LIVE</div>
  </>
);

export default LiveBadge;
