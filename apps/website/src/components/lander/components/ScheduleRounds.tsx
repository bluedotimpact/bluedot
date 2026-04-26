import type { inferRouterOutputs } from '@trpc/server';
import { trpc } from '../../../utils/trpc';
import type { AppRouter } from '../../../server/routers/_app';
import { RoundItem, buildRoundApplyUrl } from '../../../components/shared/RoundItem';

type RouterOutput = inferRouterOutputs<AppRouter>;
type CourseRounds = RouterOutput['courseRounds']['getRoundsForCourse'];
type Round = CourseRounds['intense'][number];

type ScheduleRoundsProps = {
  courseSlug: string;
  applicationUrl: string;
  fallbackContent?: React.ReactNode;
  /** Accent color for bars and "Apply now" links. Defaults to bluedot-normal */
  accentColor?: string;
};

export const ScheduleRounds = ({
  courseSlug,
  applicationUrl,
  fallbackContent,
  accentColor,
}: ScheduleRoundsProps) => {
  const { data: rounds, isLoading } = trpc.courseRounds.getRoundsForCourse.useQuery({ courseSlug });

  const hasIntenseRounds = !!(rounds?.intense && rounds.intense.length > 0);
  const hasPartTimeRounds = !!(rounds?.partTime && rounds.partTime.length > 0);

  // Check if rounds have valid numberOfUnits
  const intenseHasUnits = hasIntenseRounds && rounds.intense[0]?.numberOfUnits != null;
  const partTimeHasUnits = hasPartTimeRounds && rounds.partTime[0]?.numberOfUnits != null;

  const showDynamicSchedule = intenseHasUnits || partTimeHasUnits;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-20 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-20 w-full animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (!showDynamicSchedule) {
    return fallbackContent ?? null;
  }

  // Calculate descriptions based on numberOfUnits
  const intenseDescription = intenseHasUnits && rounds.intense[0]
    ? `${rounds.intense[0].numberOfUnits} day course (5h/day)`
    : '';
  const partTimeDescription = partTimeHasUnits && rounds.partTime[0]
    ? `${rounds.partTime[0].numberOfUnits} week course (5h/week)`
    : '';

  return (
    <div className="flex flex-col gap-16">
      {intenseHasUnits && (
        <RoundGroup
          labelShort="INTENSIVE:"
          labelLong="INTENSIVE COURSE:"
          descriptionLong={intenseDescription}
          descriptionShort={intenseDescription}
          rounds={rounds.intense}
          applicationUrl={applicationUrl}
          accentColor={accentColor}
        />
      )}

      {partTimeHasUnits && (
        <RoundGroup
          labelShort="PART-TIME:"
          labelLong="PART-TIME COURSE:"
          descriptionLong={partTimeDescription}
          descriptionShort={partTimeDescription}
          rounds={rounds.partTime}
          applicationUrl={applicationUrl}
          accentColor={accentColor}
        />
      )}
    </div>
  );
};

type RoundGroupProps = {
  labelShort: string;
  labelLong: string;
  descriptionLong: string;
  descriptionShort: string;
  rounds: Round[];
  applicationUrl: string;
  accentColor?: string;
};

const RoundGroup = ({
  labelShort,
  labelLong,
  descriptionLong,
  descriptionShort,
  rounds,
  applicationUrl,
  accentColor,
}: RoundGroupProps) => {
  // Limit to max 3 upcoming rounds displayed
  const displayedRounds = rounds.slice(0, 3);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col bd-md:flex-row bd-md:items-end gap-1 text-[15px] text-bluedot-navy">
        <span className="font-semibold uppercase tracking-[0.45px] leading-tight">
          <span className="bd-md:hidden">{labelShort}</span>
          <span className="hidden bd-md:inline min-[1024px]:hidden min-[1440px]:inline">{labelShort}</span>
          <span className="hidden min-[1024px]:inline min-[1440px]:hidden">{labelLong}</span>
        </span>
        <span className="opacity-80 font-normal leading-tight">
          <span className="bd-md:hidden">{descriptionShort}</span>
          <span className="hidden bd-md:inline">{descriptionLong}</span>
        </span>
      </div>

      <ul className="list-none flex flex-col gap-5">
        {displayedRounds.map((round, index) => (
          <li key={round.id}>
            <RoundItem
              title={round.dateRange}
              subtitle={`Applications close ${round.applicationDeadlineDetailed ?? `${round.applicationDeadline} at 23:59 UTC`}`}
              href={buildRoundApplyUrl(applicationUrl, round.id)}
              accentColor={accentColor}
              ctaColor={accentColor}
            />
            {index < displayedRounds.length - 1 && (
              <div className="relative mt-5">
                <div className="absolute inset-x-0 h-px bg-bluedot-navy/10" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
