import { COURSE_UNITS } from '@bluedot/ui/src/constants';
import useAxios from 'axios-hooks';
import { ROUTES } from '../../../../lib/routes';
import UnitLayout from '../../../../components/courses/UnitLayout';
import { GetUnitResponse } from '../../../api/units';

const CURRENT_ROUTE = ROUTES.coursesFutureOfAiUnit1;

const FutureOfAiCourseUnit1Page = () => {
  // TODO: handle error state
  const [{ data }] = useAxios<GetUnitResponse>({
    method: 'get',
    url: '/api/units',
  });

  return (
    <UnitLayout
      course="Future of AI"
      unit={1}
      title={data?.units[0]?.title || 'Failsafe'}
      route={CURRENT_ROUTE}
      units={COURSE_UNITS}
      markdown={data?.units[0]?.content || ''}
    />
  );
};

export default FutureOfAiCourseUnit1Page;
