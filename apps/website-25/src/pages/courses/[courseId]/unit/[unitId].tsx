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

  return (
    (courseId && unitId && data?.unit) ? (
      <>
        {loading && <ProgressDots />}
        <UnitLayout
          course={data?.unit.courseTitle}
          unit={unitNumber}
          title={data?.unit.title}
          route={ROUTES.coursesFutureOfAiUnit1} // TODO: Update to be dynamic
          units={COURSE_UNITS} // TODO: Update to be dynamic
          markdown={data?.unit.content}
        />
      </>
    ) : (
      <pre>{JSON.stringify(data, null, 2)}</pre>
    )
  );
};

export default CourseUnitPage;
