import type { GetStaticProps } from 'next';
import CourseLander from '../../components/lander/CourseLander';
import { createTechnicalAiSafetyProjectContent } from '../../components/lander/course-content/TechnicalAiSafetyProjectContent';
import {
  getProgramCoursePageStaticProps,
  type ProgramCoursePageProps,
} from '../../lib/programCoursePage';

const COURSE_SLUG = 'technical-ai-safety-project';

const TechnicalAiSafetyProjectSprintProgramPage = ({
  courseSlug,
  baseApplicationUrl,
  courseOgImage,
  soonestDeadline,
}: ProgramCoursePageProps) => {
  return (
    <CourseLander
      courseSlug={courseSlug}
      baseApplicationUrl={baseApplicationUrl}
      createContentFor={createTechnicalAiSafetyProjectContent}
      courseOgImage={courseOgImage}
      soonestDeadline={soonestDeadline}
      canonicalPath="/programs/technical-ai-safety-project-sprint"
    />
  );
};

export const getStaticProps: GetStaticProps<ProgramCoursePageProps> = async () => {
  return getProgramCoursePageStaticProps(COURSE_SLUG);
};

export default TechnicalAiSafetyProjectSprintProgramPage;
