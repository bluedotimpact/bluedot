import { OverflowMenu, type OverflowMenuItemProps } from '@bluedot/ui';
import { COURSE_CONFIG } from '../../lib/constants';
import { COURSE_COLORS, type CourseColorSlug } from '../../lib/courseColors';
import { formatMonthAndDay } from '../../lib/utils';
import StatusPill, { type StatusPillVariant } from './StatusPill';

export type ApplicationRowProps = {
  id: string;
  courseTitle: string | null;
  courseSlug: string | null;
  roundName: string | null;
  roundFirstDiscussionDate: string | null;
  roundLastDiscussionDate: string | null;
  pillVariant: StatusPillVariant;
  menuItems?: OverflowMenuItemProps[];
};

const formatDateRange = (start: string | null, end: string | null): string | null => {
  if (!start || !end) return null;
  return `${formatMonthAndDay(start)} - ${formatMonthAndDay(end)}`;
};

const ApplicationRow = ({
  courseTitle,
  courseSlug,
  roundName,
  roundFirstDiscussionDate,
  roundLastDiscussionDate,
  pillVariant,
  menuItems,
}: ApplicationRowProps) => {
  const dateRange = formatDateRange(roundFirstDiscussionDate, roundLastDiscussionDate);
  const courseConfig = courseSlug ? COURSE_CONFIG[courseSlug] : undefined;
  const tint = courseSlug ? COURSE_COLORS[courseSlug as CourseColorSlug]?.bright : undefined;

  return (
    <li className="overflow-hidden rounded-xl border border-color-divider bg-white">
      <div className="relative">
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
            {/* Desktop: pill sits inline on the right; on mobile it lives in a row below */}
            <span className="hidden sm:inline-flex">
              <StatusPill variant={pillVariant} />
            </span>
            {menuItems && menuItems.length > 0 && (
              <OverflowMenu ariaLabel="Application actions" items={menuItems} />
            )}
          </div>
        </div>
        {/* Mobile: status pill as a full-width row below the title block */}
        <div className="relative flex px-5 pb-5 sm:hidden">
          <StatusPill variant={pillVariant} />
        </div>
      </div>
    </li>
  );
};

export default ApplicationRow;
