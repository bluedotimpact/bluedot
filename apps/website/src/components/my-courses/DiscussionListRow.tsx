import { OverflowMenu, type OverflowMenuItemProps } from '@bluedot/ui';
import type { Unit } from '@bluedot/db';
import { type ReactNode } from 'react';
import type { GroupDiscussionWithEnd } from '../../lib/group-discussions/utils';
import { formatDateMonthAndDay, formatTime12HourClock } from '../../lib/utils';
import LiveBadge from './LiveBadge';
import { useDiscussionActions } from './useDiscussionActions';

export type DiscussionListRowMode = 'participant' | 'facilitator';

/**
 * One row-level action. `variant` decides where it surfaces:
 * - inline: desktop inline button or pill. Folded into the mobile overflow menu.
 * - overflow: overflow menu only.
 * Pills (visual-only) just omit `overflow`.
 */
export type CourseAction = {
  id: string;
  isVisible: boolean;
  variant: 'inline' | 'overflow';
  inline?: ReactNode;
  overflow?: OverflowMenuItemProps;
};

export type DiscussionListRowProps = {
  mode?: DiscussionListRowMode;
  discussion: GroupDiscussionWithEnd;
  unit: Unit | null;
  courseSlug: string;
  isAttended: boolean;
  hasPendingReschedule?: boolean;
  /** Facilitator mode: false when someone else runs this discussion, so the row is read-only. */
  isFacilitatedByCurrentUser?: boolean;
  /** Facilitator mode: "Covering for Alice" / "Covered by Bob", shown under the title. */
  substituteFacilitatorNote?: string | null;
  canReschedule: boolean;
  onReschedule: () => void;
  onClickFacilitatorReschedule?: (discussion: GroupDiscussionWithEnd) => void;
  onClickFacilitatorAssignSubstitute?: (discussion: GroupDiscussionWithEnd) => void;
  onClickViewAttendees?: () => void;
};

const DiscussionListRow = (row: DiscussionListRowProps) => {
  const {
    discussion, unit, courseSlug, isFacilitatedByCurrentUser = true, substituteFacilitatorNote = null,
  } = row;
  const {
    status, inlineActions, desktopOverflowItems, mobileOverflowItems, downloadError,
  } = useDiscussionActions(row);

  const unitNumber = unit?.unitNumber ?? discussion.unitNumber;
  const unitLabel = unitNumber !== null ? `UNIT ${unitNumber}` : 'UNIT';
  const title = unit?.title ?? 'Discussion';
  const discussionPrepareLink = unitNumber !== null ? `/courses/${courseSlug}/${unitNumber}` : null;
  const mutedClass = isFacilitatedByCurrentUser ? '' : 'opacity-60';

  return (
    <li className="flex items-center gap-5 py-4 not-last:border-b">
      <TimeWidget isLive={status === 'live'} dateTimeSeconds={discussion.startDateTime} className={mutedClass} />
      <div className={`min-w-0 flex-1 ${mutedClass}`}>
        <p className="text-size-xxs font-semibold text-bluedot-black">{unitLabel}</p>
        {discussionPrepareLink ? (
          <a
            href={discussionPrepareLink}
            className="block text-size-sm font-semibold leading-relaxed text-bluedot-black no-underline w-fit transition-colors hover:text-link hover:underline underline-offset-2"
          >
            {title}
          </a>
        ) : (
          <p className="text-size-sm font-semibold leading-relaxed text-bluedot-black">{title}</p>
        )}
        {substituteFacilitatorNote && (
          <p className="line-clamp-2 text-size-xxs font-medium leading-snug text-secondary" title={substituteFacilitatorNote}>{substituteFacilitatorNote}</p>
        )}
        {downloadError && (
          <p className="mt-1 text-size-xs text-error-fg" role="alert" aria-live="polite">{downloadError}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {/* Desktop: inline buttons/pills + overflow menu containing only `overflow`-variant items. */}
        <div className={`hidden shrink-0 items-center gap-3 sm:flex ${mutedClass}`}>
          {inlineActions}
          {desktopOverflowItems.length > 0 && (
            <OverflowMenu aria-label="Discussion actions" items={desktopOverflowItems} />
          )}
        </div>
        {/* Mobile: only the overflow menu, but it contains every action (inline buttons fold in). */}
        <div className="sm:hidden">
          {mobileOverflowItems.length > 0 && (
            <OverflowMenu aria-label="Discussion actions" items={mobileOverflowItems} />
          )}
        </div>
      </div>
    </li>
  );
};

export const TimeWidget = ({ isLive, dateTimeSeconds, className = '' }: { isLive: boolean; dateTimeSeconds: number; className?: string }) => (
  <div className={`flex shrink-0 min-w-[85px] flex-col items-stretch overflow-hidden rounded-md border ${className}`}>
    {isLive ? <LiveBadge /> : (
      <div className="px-3 py-[7px] text-center text-primary" aria-hidden>
        <div className="text-size-xs font-semibold leading-relaxed">{formatDateMonthAndDay(dateTimeSeconds)}</div>
        <div className="text-size-xs font-medium text-secondary">{formatTime12HourClock(dateTimeSeconds)}</div>
      </div>
    )}
  </div>
);

export default DiscussionListRow;
