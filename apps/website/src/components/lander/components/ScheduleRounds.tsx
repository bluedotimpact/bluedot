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
  const showDynamicSchedule = hasIntenseRounds || hasPartTimeRounds;

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

  return (
    <div className="flex flex-col gap-16">
      {hasIntenseRounds && (
        <RoundGroup
          labelShort="INTENSIVE:"
          labelLong="INTENSIVE COURSE:"
          descriptionLong="6 day course (5h/day)"
          descriptionShort="6d course (5h/day)"
          rounds={rounds.intense}
          applicationUrl={applicationUrl}
        />
      )}

      {hasPartTimeRounds && (
        <RoundGroup
          labelShort="PART-TIME:"
          labelLong="PART-TIME COURSE:"
          descriptionLong="6 week course (5h/week)"
          descriptionShort="6w course (5h/week)"
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
          <span className="min-[680px]:hidden">{labelLong}</span>
          <span className="hidden min-[680px]:inline min-[1280px]:hidden">{labelShort}</span>
          <span className="hidden min-[1280px]:inline">{labelLong}</span>
        </span>
        <span className="opacity-80 font-normal leading-tight">
          <span className="min-[680px]:hidden">{descriptionShort}</span>
          <span className="hidden min-[680px]:inline min-[1280px]:hidden">{descriptionLong}</span>
          <span className="hidden min-[1280px]:inline">{descriptionShort}</span>
        </span>
      </div>

      <div className="flex flex-col gap-0">
        {rounds.map((round, index) => (
          <div key={round.id}>
            <RoundItem round={round} applicationUrl={applicationUrl} />
            {index < rounds.length - 1 && (
              <>
                <div className="h-4" />
                <div className="h-px w-full bg-[rgba(19,19,46,0.1)]" />
                <div className="h-4" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

type RoundItemProps = {
  round: Round;
  applicationUrl: string;
};

const RoundItem = ({ round, applicationUrl }: RoundItemProps) => {
  const applyUrl = `${applicationUrl}?prefill_%5B%3E%5D%20Round=${round.id}`;

  return (
    <div className="flex flex-col gap-3 min-[680px]:flex-row min-[680px]:items-center min-[680px]:justify-between min-[680px]:gap-4">
      <div className="flex items-center gap-3 min-[680px]:gap-4">
        <div className="h-full min-h-[48px] w-1 flex-shrink-0 rounded-sm bg-[#2244BB]" />
        <div className="flex flex-col gap-3 min-[680px]:gap-0">
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

          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[15px] leading-[1.6] text-[#2244BB] min-[680px]:hidden"
          >
            Apply now
          </a>
        </div>
      </div>

      <a
        href={applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden font-medium text-[15px] leading-[1.6] text-[#2244BB] group items-center min-[680px]:flex min-[680px]:ml-auto"
      >
        <span className="transition-transform group-hover:-translate-x-1">Apply now</span>
        <span className="opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all">
          {' →'}
        </span>
      </a>
    </div>
  );
};
