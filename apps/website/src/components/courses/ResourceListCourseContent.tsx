import { useRouter } from 'next/router';
import useAxios from 'axios-hooks';
import { ErrorSection, ProgressDots } from '@bluedot/ui';
import { GetUnitResponse } from '../../pages/api/courses/[courseSlug]/[unitNumber]';
import { ResourceDisplay } from './ResourceDisplay';
import { trpc } from '../../utils/trpc';

const ResourceListCourseContent: React.FC = () => {
  const { query: { courseSlug, unitNumber } } = useRouter();

  // Fetch unit resources and exercises (auto-fetches, no auth required)
  const { data: resourcesData, isLoading: resourcesLoading, error: resourcesError } = trpc.resources.getUnitResources.useQuery({
    courseSlug: courseSlug as string,
    unitNumber: unitNumber as string,
  }, {
    enabled: !!courseSlug && !!unitNumber,
  });

  // This will almost always hit useAxios's built-in cache, because we render this on the unit page
  const [{ data: unitData, loading: unitLoading, error: unitError }] = useAxios<GetUnitResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/${unitNumber}`,
  });

  if (resourcesLoading || unitLoading) {
    return <ProgressDots />;
  }

  if (resourcesError || !resourcesData || unitError || !unitData) {
    return <ErrorSection error={resourcesError ?? unitError ?? new Error('Missing data from API')} />;
  }

  return (
    <div className="resource-list flex flex-col gap-8">
      <ResourceDisplay
        resources={resourcesData.unitResources}
        exercises={resourcesData.unitExercises}
        unitDescription={unitData.unit.description}
        unitTitle={unitData.unit.title}
        unitNumber={parseInt(unitData.unit.unitNumber, 10)}
      />
    </div>
  );
};

export default ResourceListCourseContent;
