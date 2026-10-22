import type { Group, Unit } from '@bluedot/db';
import {
  Button, H3, Tag, useCurrentTimeMs,
} from '@bluedot/ui';
import { useState, type ReactNode } from 'react';
import { FaRegClock } from 'react-icons/fa6';
import { getDiscussionTimeState, type GroupDiscussionWithEnd } from '../../lib/group-discussions/utils';
import { buildCourseUnitUrl, formatDateMonthAndDay, formatTime12HourClock } from '../../lib/utils';
import type { SwitchType } from '../../server/routers/group-switching';
import FacilitatorSwitchModal from '../courses/FacilitatorSwitchModal';
import GroupSwitchModal from '../courses/GroupSwitchModal';
import { DateBadge } from './DateBadge';

// The course name stays in the eyebrow in every state (incl. live); the live cue lives in the
// left graphic. There's no "starting soon" state — a soon discussion reads as a normal upcoming one.
const formatEyebrow = (prefix: string, unitNumber: string | undefined): string => {
  const unitText = unitNumber !== undefined ? `UNIT ${unitNumber}` : '';
  if (!prefix) return unitText;
  if (!unitText) return prefix.toUpperCase();
  return `${prefix.toUpperCase()}: ${unitText}`;
};

const formatDatetimeLabel = (startSec: number, endSec: number) =>
  `${formatDateMonthAndDay(startSec)}, ${formatTime12HourClock(startSec)} - ${formatTime12HourClock(endSec)}`;

export type NextDiscussionCardMode = 'participant' | 'facilitator';

export type NextDiscussionCardProps = {
  mode?: NextDiscussionCardMode;
  courseSlug: string;
  courseTitle: string;
  discussion: GroupDiscussionWithEnd;
  unit: Unit | null;
  group?: Group | null;
  facilitatorSubtitle?: string | null;
  pendingSwitchType?: SwitchType | null;
};

/**
 * Self-contained card showing one upcoming/live discussion. Owns its own reschedule
 * modal state so callers can drop multiple into a list without extra wiring.
 */
const NextDiscussionCard = ({
  mode = 'participant', courseSlug, courseTitle, discussion, unit, group, facilitatorSubtitle,
  pendingSwitchType = null,
}: NextDiscussionCardProps) => {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [updateTimeOpen, setUpdateTimeOpen] = useState(false);
  const currentTimeMs = useCurrentTimeMs();

  const timeState = getDiscussionTimeState({ discussion, currentTimeMs });
  const isLive = timeState === 'live';

  const unitNumber = unit?.unitNumber;
  const titleHref = unitNumber != null ? buildCourseUnitUrl({ courseSlug, unitNumber }) : undefined;
  const eyebrowPrefix = courseTitle;

  // Title always links to the unit page; the primary CTA flips to zoom when live.
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const primaryHref = isLive ? (discussion.zoomLink || undefined) : titleHref;
  const primaryLabel = isLive ? 'Join discussion' : 'Prep for discussion';

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const discussionDocUrl = group?.discussionDoc || undefined;
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const zoomLink = discussion.zoomLink || undefined;

  const roundId = discussion.round;

  return (
    <>
      <div className="flex flex-col gap-4 rounded-xl border bg-raised p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
        <div className="flex w-full items-start gap-4 sm:flex-1 sm:items-center sm:gap-5">
          <DateBadge layout={mode === 'facilitator' ? 'dateTime' : 'calendar'} isLive={isLive} dateTimeSeconds={discussion.startDateTime} />
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <div className="flex flex-col items-start">
              <p className="text-size-xxs font-semibold leading-normal text-accent">
                {formatEyebrow(eyebrowPrefix, unitNumber)}
              </p>
              <H3 className="text-size-md sm:text-size-lg">
                {titleHref ? (
                  <a
                    href={titleHref}
                    className="text-primary no-underline transition-colors hover:text-link hover:underline underline-offset-2"
                  >
                    {unit?.title ?? 'Discussion'}
                  </a>
                ) : (unit?.title ?? 'Discussion')}
              </H3>
            </div>
            <p className="text-size-xs text-primary">
              {mode === 'facilitator'
                ? (facilitatorSubtitle ?? '')
                : formatDatetimeLabel(discussion.startDateTime, discussion.endDateTime)}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-3 sm:w-auto sm:shrink-0 sm:items-center">
          {getActions({
            mode,
            isLive,
            pendingSwitchType,
            roundId,
            primaryHref,
            primaryLabel,
            discussionDocUrl,
            zoomLink,
            onOpenReschedule: () => setRescheduleOpen(true),
            onOpenUpdateTime: () => setUpdateTimeOpen(true),
          })}
        </div>
      </div>
      {rescheduleOpen && roundId && (
        <GroupSwitchModal
          handleClose={() => setRescheduleOpen(false)}
          initialUnitNumber={unit?.unitNumber}
          courseSlug={courseSlug}
          roundId={roundId}
        />
      )}
      {updateTimeOpen && roundId && (
        <FacilitatorSwitchModal
          handleClose={() => setUpdateTimeOpen(false)}
          roundId={roundId}
          initialDiscussion={{ id: discussion.id, group: discussion.group }}
          initialModalType="Update discussion time"
        />
      )}
    </>
  );
};

type NextDiscussionActionContext = {
  mode: NextDiscussionCardMode;
  isLive: boolean;
  pendingSwitchType: SwitchType | null;
  roundId: string | null;
  primaryHref: string | undefined;
  primaryLabel: string;
  discussionDocUrl: string | undefined;
  zoomLink: string | undefined;
  onOpenReschedule: () => void;
  onOpenUpdateTime: () => void;
};

const getActions = (ctx: NextDiscussionActionContext): ReactNode => {
  if (ctx.mode === 'facilitator') {
    const {
      isLive, roundId, discussionDocUrl, zoomLink, onOpenUpdateTime,
    } = ctx;
    return (
      <>
        <Button
          variant="secondary"
          size="small"
          url={discussionDocUrl}
          target="_blank"
          disabled={!discussionDocUrl}
        >
          Open discussion doc
        </Button>
        {!isLive && (
          <Button
            variant="secondary"
            size="small"
            onClick={onOpenUpdateTime}
            disabled={!roundId}
          >
            Update discussion time
          </Button>
        )}
        {isLive && (
          <Button
            variant="primary"
            size="small"
            url={zoomLink}
            target="_blank"
            disabled={!zoomLink}
            className="flex-1 sm:flex-none"
          >
            Join discussion
          </Button>
        )}
      </>
    );
  }

  const {
    isLive, pendingSwitchType, roundId, primaryHref, primaryLabel, onOpenReschedule,
  } = ctx;

  return (
    <>
      {pendingSwitchType && (
        <Tag shape="pill">
          <FaRegClock aria-hidden />
          {pendingSwitchType === 'Switch group for one unit' ? 'Reschedule requested' : 'Group switch requested'}
        </Tag>
      )}
      {roundId && !pendingSwitchType && (
        <Button
          variant="secondary"
          size="small"
          onClick={onOpenReschedule}
        >
          Reschedule
        </Button>
      )}
      <Button
        variant="primary"
        size="small"
        url={primaryHref}
        target={isLive ? '_blank' : undefined}
        className="flex-1 sm:flex-none"
      >
        {primaryLabel}
      </Button>
    </>
  );
};

export default NextDiscussionCard;
