import { ErrorSection, P, ProgressDots } from '@bluedot/ui';
import type React from 'react';
import { PageListGroup, PageListRow } from '../PageListRow';
import { formatAmountUsd } from '../../lib/utils';
import { trpc } from '../../utils/trpc';

const pluralizeGrants = (count: number) => `${count} ${count === 1 ? 'grant' : 'grants'}`;

const NextStepsChunk: React.FC = () => {
  const { data: programs, isLoading, error } = trpc.programs.getAll.useQuery();
  const { data: rapidStats } = trpc.grants.getRapidGrantStats.useQuery();
  const { data: ctStats } = trpc.grants.getCareerTransitionGrantStats.useQuery();

  const getMeta = (slug: string | null): string | null => {
    if (slug === 'rapid-grants' && rapidStats) {
      return `${formatAmountUsd(rapidStats.totalAmountUsd)} deployed so far across ${pluralizeGrants(rapidStats.count)}.`;
    }

    if (slug === 'career-transition-grant' && ctStats) {
      return `${formatAmountUsd(ctStats.totalAmountUsd)} awarded so far across ${pluralizeGrants(ctStats.count)}.`;
    }

    return null;
  };

  return (
    <div className="next-steps-chunk flex flex-col gap-6 mt-8 md:mt-6">
      <P className="text-size-sm leading-relaxed text-bluedot-navy">
        You&apos;ve got context now. Here&apos;s how you can continue contributing to AI safety.
      </P>

      {error && <ErrorSection error={error} />}
      {isLoading && <ProgressDots />}
      {!isLoading && !error && programs && (
        <PageListGroup>
          {programs.map((program) => (
            <PageListRow
              key={program.id}
              href={program.slug ? `/programs/${program.slug}` : (program.applicationForm ?? '#')}
              title={program.name}
              summary={program.description}
              meta={getMeta(program.slug)}
              ctaLabel="Explore program"
            />
          ))}
        </PageListGroup>
      )}
    </div>
  );
};

export default NextStepsChunk;
