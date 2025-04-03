import { COURSE_UNITS } from '@bluedot/ui/src/constants';
import { ROUTES } from '../../../../lib/routes';
import UnitLayout from '../../../../components/courses/UnitLayout';

const CURRENT_ROUTE = ROUTES.coursesFutureOfAiUnit1;

const FutureOfAiCourseUnit1Page = () => {
  return (
    <UnitLayout
      course="Future of AI"
      unit={1}
      title="Beyond chatbots: the expanding frontier of AI capabilities"
      route={CURRENT_ROUTE}
      units={COURSE_UNITS}
      markdown={'### How current AI systems work\n\nModels like ChatGPT operate by predicting the next word in a sequence:\n\n> **Input:** "The cat sat on the"\n>\n> **Prediction:** "mat"'}
    />
  );
};

export default FutureOfAiCourseUnit1Page;
