import { OverflowMenu, type OverflowMenuItemProps } from '@bluedot/ui';
import type { GroupDiscussion, Unit } from '@bluedot/db';
import { type ReactNode } from 'react';
import { formatDateMonthAndDay, formatTime12HourClock } from '../../lib/utils';
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
  discussion: GroupDiscussion;
  unit: Unit | null;
  courseSlug: string;
  isAttended: boolean;
  canReschedule: boolean;
  onReschedule: () => void;
  onClickFacilitatorReschedule?: (discussion: GroupDiscussion) => void;
  onClickFacilitatorAssignSubstitute?: (discussion: GroupDiscussion) => void;
  onClickViewAttendees?: () => void;
};

const DiscussionListRow = (row: DiscussionListRowProps) => {
  const { discussion, unit, courseSlug } = row;
  const {
    status, inlineActions, desktopOverflowItems, mobileOverflowItems, downloadError,
  } = useDiscussionActions(row);

  const unitNumber = unit?.unitNumber ?? discussion.unitNumber;
  const unitLabel = unitNumber !== null ? `UNIT ${unitNumber}` : 'UNIT';
  const title = unit?.title ?? 'Discussion';
  const discussionPrepareLink = unitNumber !== null ? `/courses/${courseSlug}/${unitNumber}` : null;

  return (
    <li className="flex items-center gap-5 py-4 not-last:border-b not-last:border-color-divider">
      <TimeWidget isLive={status === 'live'} dateTimeSeconds={discussion.startDateTime} />
      <div className="min-w-0 flex-1">
        <p className="text-size-xxs font-semibold text-bluedot-black">{unitLabel}</p>
        {discussionPrepareLink ? (
          <a
            href={discussionPrepareLink}
            className="block text-size-sm font-semibold leading-[24px] text-bluedot-black no-underline w-fit transition-colors hover:text-bluedot-normal hover:underline underline-offset-2"
          >
            {title}
          </a>
        ) : (
          <p className="text-size-sm font-semibold leading-[24px] text-bluedot-black">{title}</p>
        )}
        {downloadError && (
          <p className="mt-1 text-size-xxs text-red-600" role="alert" aria-live="polite">{downloadError}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {/* Desktop: inline buttons/pills + overflow menu containing only `overflow`-variant items. */}
        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          {inlineActions}
          {desktopOverflowItems.length > 0 && (
            <OverflowMenu ariaLabel="Discussion actions" items={desktopOverflowItems} />
          )}
        </div>
        {/* Mobile: only the overflow menu, but it contains every action (inline buttons fold in). */}
        <div className="sm:hidden">
          {mobileOverflowItems.length > 0 && (
            <OverflowMenu ariaLabel="Discussion actions" items={mobileOverflowItems} />
          )}
        </div>
      </div>
    </li>
  );
};

export const TimeWidget = ({ isLive, dateTimeSeconds }: { isLive: boolean; dateTimeSeconds: number }) => (
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

export default DiscussionListRow;
