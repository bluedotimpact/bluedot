import type { inferRouterOutputs } from '@trpc/server';
import { trpc } from '../../../utils/trpc';
import type { AppRouter } from '../../../server/routers/_app';

type RouterOutput = inferRouterOutputs<AppRouter>;
type CourseRounds = RouterOutput['courseRounds']['getRoundsForCourse'];
type Round = CourseRounds['intense'][number];

type ScheduleRoundsProps = {
  courseSlug: string;
  applicationUrl: string;
  fallbackContent?: React.ReactNode;
};

export const ScheduleRounds = ({
  courseSlug,
  applicationUrl,
  fallbackContent,
}: ScheduleRoundsProps) => {
  const { data: rounds, isLoading } = trpc.courseRounds.getRoundsForCourse.useQuery(
    { courseSlug },
  );

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
};

const RoundGroup = ({
  labelShort,
  labelLong,
  descriptionLong,
  descriptionShort,
  rounds,
  applicationUrl,
}: RoundGroupProps) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col min-[680px]:flex-row min-[680px]:items-end gap-1 text-[15px] text-[#13132E]">
        <span className="font-semibold uppercase tracking-[0.45px] leading-tight">
          <span className="min-[680px]:hidden">{labelShort}</span>
          <span className="hidden min-[680px]:inline min-[1024px]:hidden min-[1440px]:inline">{labelShort}</span>
          <span className="hidden min-[1024px]:inline min-[1440px]:hidden">{labelLong}</span>
        </span>
        <span className="opacity-80 font-normal leading-tight">
          <span className="min-[680px]:hidden">{descriptionShort}</span>
          <span className="hidden min-[680px]:inline">{descriptionLong}</span>
        </span>
      </div>

      <ul className="list-none flex flex-col gap-5">
        {rounds.map((round, index) => (
          <li key={round.id}>
            <RoundItem round={round} applicationUrl={applicationUrl} />
            {index < rounds.length - 1 && (
              <div className="relative mt-5">
                <div className="absolute inset-x-0 h-px bg-[rgba(19,19,46,0.1)]" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

type RoundItemProps = {
  round: Round;
  applicationUrl: string;
};

const RoundItem = ({ round, applicationUrl }: RoundItemProps) => {
  const separator = applicationUrl.includes('?') ? '&' : '?';
  const applyUrl = `${applicationUrl}${separator}prefill_%5B%3E%5D%20Round=${round.id}`;

  const dateContent = (
    <div>
      {round.dateRange && (
      <p className="text-[15px] font-semibold leading-[1.6] text-[#13132E]">
        {round.dateRange}
      </p>
      )}
      <p className="text-[15px] leading-[1.6] text-[#13132E] opacity-50">
        Application closes {round.applicationDeadline}
      </p>
    </div>
  );

  return (
    <>
      {/* Mobile: only "Apply now" link is clickable */}
      <div className="min-[680px]:hidden flex flex-col gap-2">
        <div className="flex items-stretch gap-3">
          <div className="w-1 flex-shrink-0 rounded-sm bg-[#1144CC]" />
          <div className="flex flex-col gap-3">
            {dateContent}

            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Apply now (opens in a new tab)"
              className="font-medium text-[15px] leading-[1.6] text-[#1144CC]"
            >
              Apply now →
            </a>
          </div>
        </div>
      </div>

      {/* Desktop: entire card is clickable */}
      <a
        href={applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Apply now (opens in a new tab)"
        className="hidden min-[680px]:flex flex-row items-center justify-between gap-4 group"
      >
        <div className="flex items-stretch gap-4">
          <div className="w-1 flex-shrink-0 rounded-sm bg-[#1144CC] opacity-30 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity" />
          <div className="flex flex-col">
            {dateContent}
          </div>
        </div>

        <div className="flex font-medium text-[15px] leading-[1.6] text-[#1144CC] items-center ml-auto">
          <span className="transition-transform group-hover:-translate-x-1 group-focus:-translate-x-1">Apply now</span>
          <span className="ml-1 transition-opacity group-hover:opacity-100 group-focus:opacity-100 opacity-0">
            →
          </span>
        </div>
      </a>
    </>
  );
};
