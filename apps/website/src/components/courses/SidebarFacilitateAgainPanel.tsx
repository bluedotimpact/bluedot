import { A } from '@bluedot/ui';
import { FaArrowRight } from 'react-icons/fa6';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';

type SidebarFacilitateAgainPanelProps = {
  courseSlug: string;
};

export const SidebarFacilitateAgainPanel = ({ courseSlug }: SidebarFacilitateAgainPanelProps) => {
  const { data } = trpc.facilitatorApplications.eligibleRounds.useQuery();
  const hasEligibleRound = data?.some((course) => course.courseSlug === courseSlug && course.rounds.length > 0);
  if (!hasEligibleRound) return null;

  return (
    <div className="relative p-4 md:p-6">
      <div className="border-t-hairline absolute inset-x-2 top-0 border-bluedot-navy/20 md:inset-x-[24px]" />
      <A
        href={ROUTES.facilitatorApplications.url}
        className="border-bluedot-normal text-bluedot-normal hover:bg-bluedot-lighter flex items-center gap-3 rounded-[10px] border-hairline border-solid px-3 py-4 no-underline transition-colors duration-200"
      >
        <p className="text-size-sm min-w-0 flex-1 leading-relaxed font-bold">
          Quick apply to facilitate again (~2 min)
        </p>
        <FaArrowRight className="size-5 shrink-0" />
      </A>
    </div>
  );
};
