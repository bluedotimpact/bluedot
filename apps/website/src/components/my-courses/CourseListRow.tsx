import {
  CTALinkOrButton, OverflowMenu, type OverflowMenuItemProps, addQueryParam,
} from '@bluedot/ui';
import { useState } from 'react';
import { IoBan, IoChevronDown } from 'react-icons/io5';
import { COURSE_CONFIG } from '../../lib/constants';
import { COURSE_COLORS, type CourseColorSlug } from '../../lib/courseColors';
import { ROUTES } from '../../lib/routes';
import { buildGroupSlackChannelUrl, formatMonthAndDay } from '../../lib/utils';
import DropoutModal from '../courses/DropoutModal';
import GroupSwitchModal, { type SwitchType } from '../courses/GroupSwitchModal';
import DiscussionList from './DiscussionList';
import type { EnrichedCourse } from './CourseList';

type CourseRowState = 'in-progress' | 'upcoming' | 'completed' | 'dropped';

const classifyCourseRegistration = (cr: EnrichedCourse['courseRegistration']): CourseRowState => {
  if (cr.dropoutId?.length && !cr.deferredId?.length) return 'dropped';
  if (cr.roundStatus === 'Active') return 'in-progress';
  if (cr.roundStatus === 'Future') return 'upcoming';
  return 'completed';
};

const buildSubtitle = (
  state: CourseRowState,
  group: EnrichedCourse['group'],
  facilitatorNames: string[],
  roundStartDate: string | null,
): string => {
  const parts: string[] = [];

  if (state === 'upcoming' && roundStartDate) {
    parts.push(`Course starts ${formatMonthAndDay(roundStartDate)}`);
  }

  if (group?.startTimeUtc) {
    const date = new Date(group.startTimeUtc * 1000);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    parts.push(`${weekday}s, ${time}`);
  }

  if (facilitatorNames.length > 0) {
    parts.push(`Facilitated by ${facilitatorNames.join(', ')}`);
  }

  return parts.join(' · ');
};

type CourseListRowProps = {
  course: EnrichedCourse;
};

const CourseListRow = ({ course: c }: CourseListRowProps) => {
  const {
    course, courseRegistration, group, facilitatorNames, discussions, attendedDiscussionIds, units, roundId,
    slackChannelId, activityDoc, roundStartDate,
  } = c;
  const state = classifyCourseRegistration(courseRegistration);
  const [isExpanded, setIsExpanded] = useState(state === 'in-progress');
  const [dropoutOpen, setDropoutOpen] = useState(false);
  const [groupSwitch, setGroupSwitch] = useState<{ unitNumber: string; switchType: SwitchType } | null>(null);

  const subtitle = buildSubtitle(state, group, facilitatorNames, roundStartDate);
  const showChevron = state !== 'dropped';
  const courseConfig = COURSE_CONFIG[course.slug];
  const tint = COURSE_COLORS[course.slug as CourseColorSlug]?.bright;
  const headerStyle = tint
    ? { background: `radial-gradient(ellipse 50% 230% at 50% -30%, ${tint} 0%, rgba(255,255,255,0) 100%)` }
    : undefined;

  const certificateUrl = courseRegistration.certificateId
    ? addQueryParam(ROUTES.certification.url, 'id', courseRegistration.certificateId)
    : null;
  const applyAgainUrl = `/courses/${course.slug}`;
  const slackUrl = slackChannelId ? buildGroupSlackChannelUrl(slackChannelId) : null;
  const docUrl = activityDoc;

  const overflowItems: OverflowMenuItemProps[] = [];
  if (docUrl) {
    overflowItems.push({
      id: 'doc', label: 'Open discussion doc', href: docUrl, target: '_blank',
    });
  }

  if (slackUrl) {
    overflowItems.push({
      id: 'slack', label: 'Open Slack group', href: slackUrl, target: '_blank',
    });
  }

  if (state === 'in-progress' || state === 'upcoming') {
    overflowItems.push({ id: 'drop', label: 'Drop or defer course', onAction: () => setDropoutOpen(true) });
  }

  const openReschedule = (unitNumber: string | null, switchType: SwitchType) => {
    setGroupSwitch({ unitNumber: unitNumber ?? '1', switchType });
  };

  const canExpand = state !== 'dropped';
  const toggleExpand = () => {
    if (canExpand) setIsExpanded((prev) => !prev);
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canExpand) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpand();
    }
  };

  // Stop the click on action elements from also toggling the header expand state.
  const stopPropagation = {
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
  };

  return (
    <div className="overflow-hidden rounded-xl border border-color-divider bg-white">
      <div
        className={`flex items-center gap-4 p-6 ${canExpand ? 'cursor-pointer' : ''}`}
        style={headerStyle}
        onClick={toggleExpand}
        onKeyDown={handleHeaderKeyDown}
        role={canExpand ? 'button' : undefined}
        tabIndex={canExpand ? 0 : undefined}
        aria-expanded={canExpand ? isExpanded : undefined}
        aria-label={canExpand ? `${isExpanded ? 'Collapse' : 'Expand'} ${course.title}` : undefined}
      >
        <div
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          style={{ backgroundColor: courseConfig?.iconBackground || 'var(--color-bluedot-normal)' }}
        >
          {courseConfig?.icon && <img src={courseConfig.icon} alt="" className="size-10" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-size-lg font-semibold text-bluedot-navy">{course.title}</h3>
          {state !== 'dropped' && subtitle && (
            <p className="mt-1 text-size-xs text-bluedot-navy/60">{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-4" {...stopPropagation} role="presentation">
          <div className="flex items-center gap-3">
            {state === 'completed' && certificateUrl && (
              <CTALinkOrButton variant="primary" size="small" url={certificateUrl}>View certificate</CTALinkOrButton>
            )}
            {state === 'dropped' && (
              <>
                <span className="inline-flex h-9 items-center gap-1 rounded-full bg-bluedot-lighter/30 px-3 py-[7px] text-size-xxs font-medium text-bluedot-darker">
                  <IoBan aria-hidden size={14} />
                  Dropped
                </span>
                <CTALinkOrButton variant="primary" size="small" url={applyAgainUrl}>Apply again</CTALinkOrButton>
              </>
            )}
            {state !== 'dropped' && overflowItems.length > 0 && (
              <OverflowMenu ariaLabel="Course actions" items={overflowItems} />
            )}
          </div>
          {showChevron && (
            <span
              aria-hidden
              className="flex size-9 items-center justify-center rounded border border-bluedot-normal text-bluedot-normal"
            >
              <IoChevronDown size={20} />
            </span>
          )}
        </div>
      </div>
      {isExpanded && state !== 'dropped' && discussions.length > 0 && (
        <div className="border-t border-color-divider">
          <DiscussionList
            discussions={discussions}
            units={units}
            attendedDiscussionIds={attendedDiscussionIds}
            onReschedule={openReschedule}
          />
        </div>
      )}
      {dropoutOpen && (
        <DropoutModal
          applicantId={courseRegistration.id}
          courseSlug={course.slug}
          currentRoundId={courseRegistration.roundId ?? null}
          handleClose={() => setDropoutOpen(false)}
        />
      )}
      {groupSwitch && roundId && (
        <GroupSwitchModal
          handleClose={() => setGroupSwitch(null)}
          initialUnitNumber={groupSwitch.unitNumber}
          initialSwitchType={groupSwitch.switchType}
          courseSlug={course.slug}
          roundId={roundId}
        />
      )}
    </div>
  );
};

export default CourseListRow;
