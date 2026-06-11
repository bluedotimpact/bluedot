import { trpc } from '../../../utils/trpc';
import RoundGroup from '../../shared/RoundGroup';

type ScheduleRoundsProps = {
  courseSlug: string;
  applicationUrl: string;
  fallbackContent?: React.ReactNode;
  /** Accent color for bars. Defaults to bluedot-normal */
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

  // Only show rounds with a known duration; landers read awkwardly otherwise.
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

  return (
    <div className="flex flex-col gap-16">
      {intenseHasUnits && (
        <RoundGroup
          type="intensive"
          rounds={rounds.intense}
          applicationUrl={applicationUrl}
          accentColor={accentColor}
        />
      )}

      {partTimeHasUnits && (
        <RoundGroup
          type="part-time"
          rounds={rounds.partTime}
          applicationUrl={applicationUrl}
          accentColor={accentColor}
        />
      )}
    </div>
  );
};
