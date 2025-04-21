import { useRouter } from 'next/router';
import useAxios from 'axios-hooks';
import { ProgressDots, withAuth } from '@bluedot/ui';
import UnitLayout from '../../../../components/courses/UnitLayout';
import { GetUnitResponse } from '../../../api/courses/[courseSlug]/[unitId]';

// TODO remove withAuth, it's just to force refreshing the token
const CourseUnitPage = withAuth(() => {
  const { query: { courseSlug, unitId } } = useRouter();

  const [{ data, loading }] = useAxios<GetUnitResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/${unitId}`,
  });

  const unitNumber = unitId ? parseInt(unitId as string) : 0;
  const units = data?.units;
  const unit = units?.[unitNumber - 1];

  return (
    (units && unit) ? (
      <>
        {loading && <ProgressDots />}
        <UnitLayout
          unit={unit}
          unitNumber={unitNumber}
          units={units}
        />
      </>
    ) : (
      <pre>{JSON.stringify(data, null, 2)}</pre>
    )
  );
});

export default CourseUnitPage;
