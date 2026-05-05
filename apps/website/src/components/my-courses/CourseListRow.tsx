import type { Course, CourseRegistration, Group } from '@bluedot/db';
import { CTALinkOrButton, OverflowMenu } from '@bluedot/ui';
import clsx from 'clsx';
import { useState } from 'react';
import { IoBan, IoChevronDown } from 'react-icons/io5';
import { COURSE_CONFIG } from '../../lib/constants';
import { COURSE_COLORS, type CourseColorSlug } from '../../lib/courseColors';
import DiscussionList from './DiscussionList';

type CourseRowState = 'in-progress' | 'upcoming' | 'completed' | 'dropped';

const classifyCourseRegistration = (cr: CourseRegistration): CourseRowState => {
  if (cr.dropoutId?.length && !cr.deferredId?.length) return 'dropped';
  if (cr.roundStatus === 'Active') return 'in-progress';
  if (cr.roundStatus === 'Future') return 'upcoming';
  return 'completed';
};

const ONE_HOUR_SECONDS = 3600;

const formatTimeRange = (startSec: number): string => {
  const start = new Date(startSec * 1000);
  const end = new Date((startSec + ONE_HOUR_SECONDS) * 1000);
  const fmt = (d: Date, withMeridiem: boolean) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(withMeridiem ? '' : / ?[AP]M$/, '');
  return `${fmt(start, false)} - ${fmt(end, true)}`;
};

const buildSubtitle = (group: Group | null, facilitatorNames: string[]): string => {
  const parts: string[] = [];
  if (group?.startTimeUtc) {
    const date = new Date(group.startTimeUtc * 1000);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    parts.push(`${weekday}s, ${formatTimeRange(group.startTimeUtc)}`);
  }

  if (facilitatorNames.length > 0) {
    parts.push(`Facilitated by ${facilitatorNames.join(', ')}`);
  }

  return parts.join(' • ');
};

type CourseListRowProps = {
  course: Course;
  courseRegistration: CourseRegistration;
  group: Group | null;
  facilitatorNames: string[];
};

const CourseListRow = ({ course, courseRegistration, group, facilitatorNames }: CourseListRowProps) => {
  const state = classifyCourseRegistration(courseRegistration);
  const [isExpanded, setIsExpanded] = useState(state === 'in-progress');
  const subtitle = buildSubtitle(group, facilitatorNames);
  const showChevron = state !== 'dropped';
  const courseConfig = COURSE_CONFIG[course.slug];
  const tint = COURSE_COLORS[course.slug as CourseColorSlug]?.bright;
  const headerStyle = tint
    ? { background: `radial-gradient(ellipse 50% 230% at 50% -30%, ${tint} 0%, rgba(255,255,255,0) 100%)` }
    : undefined;

  const overflowItems = [
    { id: 'doc', label: 'Open discussion doc', href: '#' },
    { id: 'slack', label: 'Open Slack group', href: '#' },
    { id: 'participants', label: 'View participants', onAction: () => {} },
    ...(state === 'in-progress' || state === 'upcoming'
      ? [{ id: 'drop', label: 'Drop or defer course', onAction: () => {} }]
      : []),
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-color-divider bg-white">
      <div className="flex items-center gap-4 p-6" style={headerStyle}>
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
        <div className="flex shrink-0 items-center gap-4">
          <div className="flex items-center gap-3">
            {state === 'completed' && courseRegistration.certificateCreatedAt && (
              <CTALinkOrButton variant="primary" size="small" url="#">View certificate</CTALinkOrButton>
            )}
            {state === 'dropped' && (
              <>
                <span className="inline-flex h-9 items-center gap-1 rounded-full bg-bluedot-lighter/30 px-3 py-[7px] text-size-xxs font-medium text-bluedot-darker">
                  <IoBan aria-hidden size={14} />
                  Dropped
                </span>
                <CTALinkOrButton variant="primary" size="small" url="#">Apply again</CTALinkOrButton>
              </>
            )}
            {state !== 'dropped' && (
              <OverflowMenu ariaLabel="Course actions" items={overflowItems} />
            )}
          </div>
          {showChevron && (
            <button
              type="button"
              aria-label={isExpanded ? 'Collapse course' : 'Expand course'}
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded((prev) => !prev)}
              className="flex size-9 cursor-pointer items-center justify-center rounded border border-bluedot-normal text-bluedot-normal transition-colors hover:bg-bluedot-normal/5"
            >
              <IoChevronDown
                size={20}
                className={clsx('transition-transform duration-200', isExpanded && 'rotate-180')}
              />
            </button>
          )}
        </div>
      </div>
      {isExpanded && state !== 'dropped' && (
        <div className="border-t border-color-divider">
          <DiscussionList />
        </div>
      )}
    </div>
  );
};

export default CourseListRow;
