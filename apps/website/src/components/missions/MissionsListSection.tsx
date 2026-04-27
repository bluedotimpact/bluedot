import { P } from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import { ROUTES } from '../../lib/routes';
import type { AppRouter } from '../../server/routers/_app';
import { PageListGroup, PageListRow } from '../PageListRow';

type Missions = inferRouterOutputs<AppRouter>['missions']['getAll'];

const MissionsListSection = ({ missions }: { missions: Missions }) => {
  const renderRow = (mission: Missions[number]) => (
    <PageListRow
      key={mission.id}
      href={`${ROUTES.missions.url}/${mission.slug}`}
      title={mission.title ?? ''}
      summary={mission.subtitle ?? undefined}
    />
  );

  return (
    <section className="section section-body">
      {missions.length === 0 ? (
        <P>No missions are listed right now. Check back soon.</P>
      ) : (
        <PageListGroup>
          {missions.map(renderRow)}
        </PageListGroup>
      )}
    </section>
  );
};

export default MissionsListSection;
