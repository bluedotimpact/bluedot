import { OverflowMenu, type OverflowMenuItemProps } from '@bluedot/ui';
import { COURSE_CONFIG } from '../../lib/constants';
import { COURSE_COLORS, type CourseColorSlug } from '../../lib/courseColors';
import { formatMonthAndDay } from '../../lib/utils';
import { APPLICATION_STATUS_LABEL, type ApplicationStatus } from './applicationTabs';

export type ApplicationRowProps = {
  id: string;
  courseTitle: string | null;
  courseSlug: string | null;
  roundName: string | null;
  roundFirstDiscussionDate: string | null;
  roundLastDiscussionDate: string | null;
  status: ApplicationStatus;
  menuItems?: OverflowMenuItemProps[];
};

const formatDateRange = (start: string | null, end: string | null): string | null => {
  if (!start || !end) return null;
  return `${formatMonthAndDay(start)} - ${formatMonthAndDay(end)}`;
};

const STATUS_PILL_CLASS = 'text-size-xxs min-h-9 items-center justify-center gap-1 rounded-full bg-bluedot-lighter/30 px-3 py-[7px] font-medium text-bluedot-navy';

const ApplicationRow = ({
  courseTitle,
  courseSlug,
  roundName,
  roundFirstDiscussionDate,
  roundLastDiscussionDate,
  status,
  menuItems,
}: ApplicationRowProps) => {
  const dateRange = formatDateRange(roundFirstDiscussionDate, roundLastDiscussionDate);
  const courseConfig = courseSlug ? COURSE_CONFIG[courseSlug] : undefined;
  const tint = courseSlug ? COURSE_COLORS[courseSlug as CourseColorSlug]?.bright : undefined;
  const statusLabel = APPLICATION_STATUS_LABEL[status];

  return (
    <li className="relative overflow-hidden rounded-xl border border-charcoal-light bg-white">
      {tint && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse 50% 230% at 50% -30%, ${tint} 0%, rgba(255,255,255,0) 100%)` }}
        />
      )}
      <div className="relative flex items-start gap-4 p-5 pb-3.5 sm:items-center sm:p-6">
        <div
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg sm:size-16 sm:rounded-2xl"
          style={{ backgroundColor: courseConfig?.iconBackground ?? 'var(--color-bluedot-normal)' }}
        >
          <img
            src={courseConfig?.icon ?? '/images/logo/BlueDot_Impact_Icon_White.svg'}
            className="size-7 sm:size-10"
          />
        </div>
        <div className="min-w-0 flex-1">
          {courseTitle && (
            <p className="mb-1 text-size-xxs font-semibold uppercase tracking-wide text-bluedot-normal">
              {courseTitle}
            </p>
          )}
          <p className="text-pretty text-size-md font-semibold text-bluedot-navy">
            {roundName ?? 'Round'}
          </p>
          {dateRange && (
            <p className="mt-1 text-size-xs text-bluedot-navy/60">{dateRange}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className={`hidden sm:inline-flex ${STATUS_PILL_CLASS}`}>{statusLabel}</span>
          {menuItems && menuItems.length > 0 && (
            <OverflowMenu ariaLabel="Application actions" items={menuItems} />
          )}
        </div>
      </div>
      <div className="relative px-5 pb-5 sm:hidden">
        <span className={`inline-flex ${STATUS_PILL_CLASS}`}>{statusLabel}</span>
      </div>
    </li>
  );
};

export default ApplicationRow;
