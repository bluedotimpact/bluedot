import { CTALinkOrButton } from '@bluedot/ui';
import { COURSE_CONFIG } from '../../lib/constants';
import { COURSE_COLORS, type CourseColorSlug } from '../../lib/courseColors';
import { ROUTES } from '../../lib/routes';
import { formatDateRange } from '../../lib/utils';
import type { EligibleRoundsCourse } from '../../server/routers/facilitator-applications';
import { trpc } from '../../utils/trpc';

const CourseQuickApplyCard = ({ course }: { course: EligibleRoundsCourse }) => {
  const courseConfig = course.courseSlug ? COURSE_CONFIG[course.courseSlug] : undefined;
  const tint = course.courseSlug ? COURSE_COLORS[course.courseSlug as CourseColorSlug]?.bright : undefined;

  return (
    <li className="border-charcoal-light relative overflow-hidden rounded-xl border bg-white">
      {tint && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse 50% 230% at 50% -30%, ${tint} 0%, rgba(255,255,255,0) 100%)` }}
        />
      )}
      <details className="group relative">
        <summary className="flex cursor-pointer list-none items-center gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
          <div
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg sm:size-12 sm:rounded-2xl"
            style={{ backgroundColor: courseConfig?.iconBackground ?? 'var(--color-bluedot-normal)' }}
          >
            <img
              src={courseConfig?.icon ?? '/images/logo/BlueDot_Impact_Icon_White.svg'}
              className="size-7 sm:size-8"
              alt=""
            />
          </div>
          <p className="text-size-md text-bluedot-navy min-w-0 flex-1 font-semibold text-pretty">
            {course.courseTitle ?? 'Course'}
          </p>
          <svg
            aria-hidden
            className="text-bluedot-navy size-5 shrink-0 transition-transform group-open:rotate-180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <ul className="border-charcoal-light flex flex-col border-t px-5 pb-5 sm:px-6 sm:pb-6">
          {course.rounds.map((round) => {
            const dateRange = formatDateRange(round.firstDiscussionDate, round.lastDiscussionDate);
            return (
              <li
                key={round.id}
                className="border-charcoal-light flex flex-wrap items-center justify-between gap-3 border-b py-4 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0 flex flex-col gap-1">
                  <p className="text-size-md text-bluedot-navy font-semibold">{round.label}</p>
                  {dateRange && <p className="text-size-xs text-bluedot-navy/80">{dateRange}</p>}
                </div>
                <CTALinkOrButton size="small" variant="secondary" url={`${ROUTES.quickApply.url}?round=${round.id}`}>
                  Quick apply
                </CTALinkOrButton>
              </li>
            );
          })}
        </ul>
      </details>
    </li>
  );
};

const QuickApplyPanel = () => {
  const { data } = trpc.facilitatorApplications.eligibleRounds.useQuery();

  if (!data || data.length === 0) return null;

  return (
    <section className="flex flex-col gap-4" aria-label="Quick apply to courses you've facilitated">
      <h2 className="text-size-md text-bluedot-black font-semibold">Quick apply to courses you&rsquo;ve facilitated</h2>
      <ul className="flex flex-col gap-3">
        {data.map((course) => (
          <CourseQuickApplyCard key={course.courseId} course={course} />
        ))}
      </ul>
    </section>
  );
};

export default QuickApplyPanel;
