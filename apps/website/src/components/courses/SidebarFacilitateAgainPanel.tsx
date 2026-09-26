import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';
import { SidebarActionCard } from './SidebarActionCard';

type SidebarFacilitateAgainPanelProps = {
  courseSlug: string;
};

export const SidebarFacilitateAgainPanel = ({ courseSlug }: SidebarFacilitateAgainPanelProps) => {
  const { data } = trpc.facilitatorApplications.eligibleRounds.useQuery();
  const hasEligibleRound = data?.some((course) => course.courseSlug === courseSlug && course.rounds.length > 0);
  if (!hasEligibleRound) return null;

  return (
    <SidebarActionCard
      tone="outline"
      title="Quick apply to facilitate again (~2 min)"
      href={ROUTES.facilitatorApplications.url}
    />
  );
};
