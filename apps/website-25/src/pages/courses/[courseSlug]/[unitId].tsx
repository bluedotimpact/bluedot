import { useRouter } from 'next/router';
import useAxios from 'axios-hooks';
import { ProgressDots } from '@bluedot/ui';
import UnitLayout from '../../../components/courses/UnitLayout';
import { GetUnitResponse } from '../../api/courses/[courseSlug]/[unitId]';

const CourseUnitPage = () => {
  const { query: { courseSlug, unitId } } = useRouter();

  const [{ data, loading }] = useAxios<GetUnitResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/${unitId}`,
  });

  const unitNumber = typeof unitId === 'string' ? parseInt(unitId) : 0;
  const units = data?.units;
  const unit = units?.find((u) => u.unitNumber === unitId);

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
};

export default CourseUnitPage;
