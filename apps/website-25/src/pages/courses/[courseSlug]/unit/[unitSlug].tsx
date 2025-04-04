import { COURSE_UNITS } from '@bluedot/ui/src/constants';
import { useRouter } from 'next/router';
import useAxios from 'axios-hooks';
import { ProgressDots } from '@bluedot/ui';
import UnitLayout from '../../../../components/courses/UnitLayout';
import { GetUnitResponse } from '../../../api/units';
import { ROUTES } from '../../../../lib/routes';

const CourseUnitPage = () => {
  const { query: { courseSlug, unitSlug } } = useRouter();

  const [{ data, loading }] = useAxios<GetUnitResponse>({
    method: 'get',
    url: `/api/units?courseTitle=${courseSlug}`,
  });

  const unitNumber = unitSlug ? parseInt(unitSlug as string) : 0;
  const unitIndex = unitNumber - 1;

  return (
    (courseSlug && unitSlug && data?.units[unitIndex]) ? (
      <>
        {loading && <ProgressDots />}
        <UnitLayout
          course={data?.units[unitIndex].courseTitle}
          unit={unitNumber}
          title={data?.units[unitIndex].title}
          route={ROUTES.coursesFutureOfAiUnit1} // TODO: Update to be dynamic
          units={COURSE_UNITS} // TODO: Update to be dynamic
          markdown={data?.units[unitIndex].content}
        />
      </>
    ) : (
      <pre>{JSON.stringify(data, null, 2)}</pre>
    )
  );
};

export default CourseUnitPage;
