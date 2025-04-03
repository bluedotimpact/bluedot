import { COURSE_UNITS } from '@bluedot/ui/src/constants';
import { ROUTES } from '../../../../lib/routes';
import UnitLayout from '../../../../components/courses/UnitLayout';

const CURRENT_ROUTE = ROUTES.coursesFutureOfAiUnit2;

const FutureOfAiCourseUnit2Page = () => {
  return (
    <UnitLayout
      course="Future of AI"
      unit={2}
      title="Artificial general intelligence: on the horizon?"
      route={CURRENT_ROUTE}
      units={COURSE_UNITS}
      markdown={'### What is AGI?\n\nThere are many definitions of AGI, but most try to point at systems that can think and act at a level matching or exceeding human capability across a wide range of tasks.\n\nFor this course, we\'ll use the following definition:\n\n>AGI = an AI system that can do most remote jobs as well as, or better than humans.'}
    />
  );
};

export default FutureOfAiCourseUnit2Page;
