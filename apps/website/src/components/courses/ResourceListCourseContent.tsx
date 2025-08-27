import { useRouter } from 'next/router';
import useAxios from 'axios-hooks';
import { ErrorSection, ProgressDots } from '@bluedot/ui';
import { GetUnitResourcesResponse } from '../../pages/api/courses/[courseSlug]/[unitNumber]/resources';
import { GetUnitResponse } from '../../pages/api/courses/[courseSlug]/[unitNumber]';
import { ResourceDisplay } from './ResourceDisplay';

const ResourceListCourseContent: React.FC = () => {
  const { query: { courseSlug, unitNumber } } = useRouter();

  const [{ data: resourcesData, loading: resourcesLoading, error: resourcesError }] = useAxios<GetUnitResourcesResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/${unitNumber}/resources`,
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
    return <ErrorSection error={resourcesError ?? new Error('Missing data from API')} />;
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
