import { CTALinkOrButton } from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import { trpc } from '../../utils/trpc';
import type { AppRouter } from '../../server/routers/_app';
import { RoundItem, buildRoundApplyUrl } from '../shared/RoundItem';

type RouterOutput = inferRouterOutputs<AppRouter>;
type AllRounds = RouterOutput['courseRounds']['getAllUpcomingRounds'];
type Round = AllRounds['intense'][number];

export const UpcomingRounds = () => {
  const { data: allRounds, isLoading } = trpc.courseRounds.getAllUpcomingRounds.useQuery();

  if (isLoading) {
    return (
      <section className="bg-white pt-[16px] pb-[48px] px-5 min-[680px]:pt-0 min-[680px]:pb-[64px] min-[680px]:px-8 min-[1024px]:pb-[80px] lg:px-12 min-[1280px]:pb-[96px] min-[1440px]:pt-[24px] min-[1920px]:pt-0 xl:px-16 2xl:px-20">
        <div className="flex flex-col gap-4 max-w-screen-xl mx-auto">
          <div className="h-20 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-20 w-full animate-pulse rounded bg-gray-200" />
        </div>
      </section>
    );
  }

  if (!allRounds) {
    return null;
  }

  const intensiveRounds = selectDiverseRounds(allRounds.intense);
  const partTimeRounds = selectDiverseRounds(allRounds.partTime);

  const hasIntensiveRounds = intensiveRounds.length > 0;
  const hasPartTimeRounds = partTimeRounds.length > 0;

  if (!hasIntensiveRounds && !hasPartTimeRounds) {
    return null;
  }

  return (
    <section className="bg-white pt-[16px] pb-[48px] px-5 min-[680px]:pt-0 min-[680px]:pb-[64px] min-[680px]:px-8 min-[1024px]:pb-[80px] lg:px-12 min-[1280px]:pb-[96px] min-[1440px]:pt-[24px] min-[1920px]:pt-0 xl:px-16 2xl:px-20">
      <div className="flex flex-col items-center gap-6 max-w-screen-xl mx-auto">
        {/* Section Title */}
        <h2 className="text-[24px] leading-[140%] tracking-[-0.5px] font-[450] text-bluedot-navy text-center">
          Upcoming rounds
        </h2>

        {/* Rounds Container */}
        <div className="flex flex-col gap-16 w-full min-[680px]:max-w-[780px] min-[680px]:mx-auto">
          {hasIntensiveRounds && (
            <RoundGroup
              label="INTENSIVE"
              rounds={intensiveRounds}
            />
          )}

          {hasPartTimeRounds && (
            <RoundGroup
              label="PART-TIME"
              rounds={partTimeRounds}
            />
          )}
        </div>

        {/* CTA Button */}
        <CTALinkOrButton
          url="/courses"
          className="mt-[24px] px-4 bg-bluedot-navy/10 text-bluedot-navy hover:text-bluedot-navy text-[15px] font-[450] tracking-[-0.3px] rounded-md hover:bg-bluedot-navy/15"
        >
          See all rounds
        </CTALinkOrButton>
      </div>
    </section>
  );
};

type RoundGroupProps = {
  label: string;
  rounds: Round[];
};

const RoundGroup = ({ label, rounds }: RoundGroupProps) => {
  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-[15px] font-semibold uppercase tracking-[0.45px] leading-tight text-bluedot-navy text-center min-[680px]:text-left">
        {label}
      </h3>

      <ul className="list-none flex flex-col gap-5">
        {rounds.map((round, index) => (
          <li key={round.id}>
            <RoundItem
              title={`${round.courseTitle} \u00b7 ${round.dateRange}`}
              subtitle={`Applications close ${round.applicationDeadlineDetailed ?? `${round.applicationDeadline} at 23:59 UTC`}`}
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              href={buildRoundApplyUrl(round.applyUrl || '', round.id)}
            />
            {index < rounds.length - 1 && (
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

function selectDiverseRounds(rounds: Round[]): Round[] {
  if (rounds.length === 0) {
    return [];
  }

  const selectedRounds: Round[] = [];
  const seenCourses = new Set<string>();

  for (const round of rounds) {
    if (selectedRounds.length >= 3) {
      break;
    }

    const { courseId } = round;
    if (!seenCourses.has(courseId)) {
      selectedRounds.push(round);
      seenCourses.add(courseId);
    }
  }

  if (selectedRounds.length < 3) {
    for (const round of rounds) {
      if (selectedRounds.length >= 3) {
        break;
      }

      if (!selectedRounds.find((r) => r.id === round.id)) {
        selectedRounds.push(round);
      }
    }
  }

  return selectedRounds;
}
