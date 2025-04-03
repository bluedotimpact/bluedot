import { COURSE_UNITS } from '@bluedot/ui/src/constants';
import { ROUTES } from '../../../../lib/routes';
import UnitLayout from '../../../../components/courses/UnitLayout';

const CURRENT_ROUTE = ROUTES.coursesFutureOfAiUnit4;

const FutureOfAiCourseUnit4Page = () => {
  return (
    <UnitLayout
      course="Future of AI"
      unit={4}
      title="What can be done to prepare for AGI?"
      route={CURRENT_ROUTE}
      units={COURSE_UNITS}
      markdown={'### The challenge we face\n\nLooking back at what we\'ve covered so far:\n\n- AI systems are becoming incredibly capable (Unit 1)\n- These systems may reach general human-level intelligence within years (Unit 2)\n - This could bring enormous benefits, but also unprecedented risks (Unit 3)\n\nThis leaves us with a critical question: **How do we navigate this transition safely?**'}
    />
  );
};

export default FutureOfAiCourseUnit4Page;
