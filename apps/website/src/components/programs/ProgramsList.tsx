import { ErrorSection, ProgressDots } from '@bluedot/ui';
import { PageListGroup, PageListRow } from '../PageListRow';
import { trpc } from '../../utils/trpc';
import { formatAmountUsd } from '../../lib/utils';

const pluralizeGrants = (count: number) => `${count} ${count === 1 ? 'grant' : 'grants'}`;

type ProgramsListProps = {
  utmCampaign?: string;
};

export const ProgramsList = ({ utmCampaign }: ProgramsListProps) => {
  const { data: programs, isLoading, error } = trpc.programs.getAll.useQuery();
  const { data: rapidStats } = trpc.grants.getRapidGrantStats.useQuery();
  const { data: ctStats } = trpc.grants.getCareerTransitionGrantStats.useQuery();

  // Per-slug stats overlay. Keeps the live "$50k+ across N grants" copy fresh
  // without baking stale numbers into Airtable.
  const getMeta = (slug: string | null): string | null => {
    if (slug === 'rapid-grants' && rapidStats) {
      return `${formatAmountUsd(rapidStats.totalAmountUsd)} deployed so far across ${pluralizeGrants(rapidStats.count)}.`;
    }

    if (slug === 'career-transition-grant' && ctStats) {
      return `${formatAmountUsd(ctStats.totalAmountUsd)} awarded so far across ${pluralizeGrants(ctStats.count)}.`;
    }

    return null;
  };

  if (error) return <ErrorSection error={error} />;
  if (isLoading) return <ProgressDots />;
  if (!programs) return null;

  const buildHref = (program: { slug: string | null; applicationForm: string | null }) => {
    const base = program.slug ? `/programs/${program.slug}` : (program.applicationForm ?? '#');
    if (!utmCampaign || base === '#') return base;
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}utm_source=website&utm_campaign=${utmCampaign}`;
  };

  return (
    <PageListGroup>
      {programs.map((program) => (
        <PageListRow
          key={program.id}
          href={buildHref(program)}
          title={program.name}
          summary={program.description}
          meta={getMeta(program.slug)}
          ctaLabel="Explore program"
        />
      ))}
    </PageListGroup>
  );
};
