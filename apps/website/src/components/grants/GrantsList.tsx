import { ErrorSection, ProgressDots } from '@bluedot/ui';
import { PageListGroup, PageListRow } from '../PageListRow';
import { getGrantPath } from '../../lib/grantRoutes';
import { formatAmountUsd } from '../../lib/utils';
import { trpc } from '../../utils/trpc';

const pluralizeGrants = (count: number) => `${count} ${count === 1 ? 'grant' : 'grants'}`;

type GrantsListProps = {
  utmCampaign?: string;
};

export const GrantsList = ({ utmCampaign }: GrantsListProps) => {
  const { data: grants, isLoading, error } = trpc.programs.getGrants.useQuery();
  const { data: rapidStats } = trpc.grants.getRapidGrantStats.useQuery();
  const { data: careerTransitionStats } = trpc.grants.getCareerTransitionGrantStats.useQuery();

  const getMeta = (slug: string | null): string | null => {
    if (slug === 'rapid-grants' && rapidStats) {
      return `${formatAmountUsd(rapidStats.totalAmountUsd)} deployed so far across ${pluralizeGrants(rapidStats.count)}.`;
    }

    if (slug === 'career-transition-grant' && careerTransitionStats) {
      return `${formatAmountUsd(careerTransitionStats.totalAmountUsd)} awarded so far across ${pluralizeGrants(careerTransitionStats.count)}.`;
    }

    return null;
  };

  const buildHref = (slug: string | null) => {
    const base = getGrantPath(slug);
    if (!base || !utmCampaign) return base;
    return `${base}?utm_source=website&utm_campaign=${utmCampaign}`;
  };

  if (error) return <ErrorSection error={error} />;
  if (isLoading) return <ProgressDots />;
  if (!grants) return null;

  return (
    <PageListGroup>
      {grants.map((grant) => (
        <PageListRow
          key={grant.id}
          href={buildHref(grant.slug)}
          title={grant.name}
          summary={grant.description}
          meta={getMeta(grant.slug)}
          ctaLabel="Explore grant"
        />
      ))}
    </PageListGroup>
  );
};
