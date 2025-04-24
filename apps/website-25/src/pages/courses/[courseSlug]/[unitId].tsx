import { useRouter } from 'next/router';
import useAxios from 'axios-hooks';
import { ErrorSection, ProgressDots } from '@bluedot/ui';
import UnitLayout from '../../../components/courses/UnitLayout';
import { GetUnitResponse } from '../../api/courses/[courseSlug]/[unitId]';

const CourseUnitPage = () => {
  const { query: { courseSlug, unitId } } = useRouter();

  const [{ data, loading, error }] = useAxios<GetUnitResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/${unitId}`,
  });

  const unitNumber = typeof unitId === 'string' ? parseInt(unitId) : 0;

  if (loading) {
    return <ProgressDots />;
  }

  if (error || !data) {
    return <ErrorSection error={error ?? new Error('Missing data from API')} />;
  }

  return (
    <UnitLayout
      unit={data.unit}
      units={data.units}
      unitNumber={unitNumber}
    />
  );
};

export default CourseUnitPage;
