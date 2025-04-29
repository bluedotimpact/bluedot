import { useRouter } from 'next/router';
import useAxios from 'axios-hooks';
import { ErrorSection, ProgressDots } from '@bluedot/ui';
import { GetUnitResourcesResponse } from '../../pages/api/courses/[courseSlug]/[unitId]/resources';

const ResourceListCourseContent: React.FC = () => {
  const { query: { courseSlug, unitId } } = useRouter();

  const [{ data, loading, error }] = useAxios<GetUnitResourcesResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/${unitId}/resources`,
  });

  if (loading) {
    return <ProgressDots />;
  }

  if (error || !data) {
    return <ErrorSection error={error ?? new Error('Missing data from API')} />;
  }

  // For now, just dump the API response as JSON
  return (
    <div>
      <h2>Unit Resources</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default ResourceListCourseContent;
