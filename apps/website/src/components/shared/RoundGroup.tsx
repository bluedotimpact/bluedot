import type { CourseRound } from '../../server/routers/course-rounds';
import { buildRoundApplyUrl, RoundItem } from './RoundItem';

type RoundGroupProps = {
  type: 'intensive' | 'part-time';
  rounds: CourseRound[];
  applicationUrl: string;
  accentColor?: string;
  /** Cap the number of rounds shown. Defaults to showing all. */
  maxRounds?: number;
};

// eslint-disable-next-line react/function-component-definition
export default function RoundGroup({ type, rounds, applicationUrl, accentColor, maxRounds }: RoundGroupProps) {
  const displayedRounds = maxRounds !== undefined ? rounds.slice(0, maxRounds) : rounds;
  const firstRound = displayedRounds[0];
  const numberOfUnits = firstRound?.numberOfUnits;

  const label = type === 'intensive' ? 'Intensive:' : 'Part-time:';
  const unitLabel = type === 'intensive' ? 'day' : 'week';
  const perLabel = type === 'intensive' ? '5h/day' : '5h/week';
  const description = numberOfUnits ? `${numberOfUnits} ${unitLabel} course (${perLabel})` : `${unitLabel} course`;

  return (
    <div>
      <div className="text-bluedot-navy mb-6 text-size-sm leading-tight">
        <span className="font-semibold tracking-[0.45px] uppercase">{label}</span>
        <span className="ml-1 font-normal opacity-80">{description}</span>
      </div>
      <ul className="flex flex-col">
        {displayedRounds.map((round, index) => (
          <li key={round.id}>
            <RoundItem
              title={round.dateRange}
              subtitle={`Applications close ${round.applicationDeadlineDetailed ?? `${round.applicationDeadline} at 23:59 UTC`}`}
              href={buildRoundApplyUrl(applicationUrl, round.id)}
              accentColor={accentColor}
            />
            {index < displayedRounds.length - 1 && <div className="border-bluedot-navy/10 my-4 border-t" />}
          </li>
        ))}
      </ul>
    </div>
  );
}
