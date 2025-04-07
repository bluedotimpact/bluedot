import { COURSE_UNITS } from '@bluedot/ui/src/constants';
import { useRouter } from 'next/router';
import useAxios from 'axios-hooks';
import { ProgressDots } from '@bluedot/ui';
import UnitLayout from '../../../../components/courses/UnitLayout';
import { GetUnitResponse } from '../../../api/courses/[courseId]/[unitId]';
import { ROUTES } from '../../../../lib/routes';

const CourseUnitPage = () => {
  const { query: { courseId, unitId } } = useRouter();

  const [{ data, loading }] = useAxios<GetUnitResponse>({
    method: 'get',
    url: `/api/courses/${courseId}/${unitId}`,
  });

  const unitNumber = unitId ? parseInt(unitId as string) : 0;
  const units = data?.units;
  const unit = units?.[unitNumber - 1];

  return (
    (units && unit) ? (
      <>
        {loading && <ProgressDots />}
        <UnitLayout
          courseId={courseId}
          courseTitle={unit.courseTitle}
          unitNumber={unitNumber}
          unitTitle={unit.title}
          unitContent={unit.content}
          units={units}
          route={ROUTES.coursesFutureOfAiUnit1} // TODO: Update to be dynamic
        />
      </>
    ) : (
      <pre>{JSON.stringify(data, null, 2)}</pre>
    )
  );
};

export default CourseUnitPage;
