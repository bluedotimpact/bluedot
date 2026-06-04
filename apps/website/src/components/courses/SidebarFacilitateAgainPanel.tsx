import { A } from '@bluedot/ui';
import { FaArrowRight } from 'react-icons/fa6';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';

type SidebarFacilitateAgainPanelProps = {
  courseSlug: string;
};

export const SidebarFacilitateAgainPanel: React.FC<SidebarFacilitateAgainPanelProps> = ({ courseSlug }) => {
  const { data } = trpc.facilitatorApplications.eligibleRounds.useQuery();
  const round = data?.find((course) => course.courseSlug === courseSlug)?.rounds[0];
  if (!round) return null;

  return (
    <div className="relative p-4 md:p-6">
      <div className="border-t-hairline absolute inset-x-2 top-0 border-bluedot-navy/20 md:inset-x-[24px]" />
      <A
        href={`${ROUTES.quickApply.url}?round=${round.id}`}
        className="border-bluedot-normal text-bluedot-normal flex items-center gap-3 rounded-[10px] border-[0.5px] border-solid px-3 py-4 no-underline transition-opacity hover:opacity-90"
      >
        <p className="text-size-sm min-w-0 flex-1 leading-[1.5] font-bold">
          Quick apply to facilitate again (~2 min)
        </p>
        <FaArrowRight className="size-5 shrink-0" />
      </A>
    </div>
  );
};
