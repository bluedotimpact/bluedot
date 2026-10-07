import { P, ListGroup, ListRow } from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import { ROUTES } from '../../lib/routes';
import type { AppRouter } from '../../server/routers/_app';

type Missions = inferRouterOutputs<AppRouter>['missions']['getAll'];

const MissionsListSection = ({ missions }: { missions: Missions }) => {
  const renderRow = (mission: Missions[number]) => (
    <ListRow
      key={mission.id}
      href={`${ROUTES.missions.url}/${mission.slug}`}
      title={mission.title ?? ''}
      summary={mission.subtitle ?? undefined}
    />
  );

  return missions.length === 0 ? (
    <P>No missions are listed right now. Check back soon.</P>
  ) : (
    <ListGroup>
      {missions.map(renderRow)}
    </ListGroup>
  );
};

export default MissionsListSection;
