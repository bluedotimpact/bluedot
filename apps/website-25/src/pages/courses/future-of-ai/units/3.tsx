import { COURSE_UNITS } from '@bluedot/ui/src/constants';
import { ROUTES } from '../../../../lib/routes';
import UnitLayout from '../../../../components/courses/UnitLayout';

const CURRENT_ROUTE = ROUTES.coursesFutureOfAiUnit3;

const FutureOfAiCourseUnit3Page = () => {
  return (
    <UnitLayout
      course="Future of AI"
      unit={3}
      title="AGI will drastically change how we live"
      route={CURRENT_ROUTE}
      units={COURSE_UNITS}
      markdown={'**You might be living through one of the most important technological transitions in human history.** The development of AGI could transform society in profound ways.\n\nThroughout history, major technologies have changed not just what humans could do, but how we live:\n\n- Fire gave us warmth, cooking, and new tools, while also enabling violent conflict.'}
    />
  );
};

export default FutureOfAiCourseUnit3Page;
