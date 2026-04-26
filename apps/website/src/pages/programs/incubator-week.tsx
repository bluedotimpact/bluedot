import type { GetStaticProps } from 'next';
import CourseLander from '../../components/lander/CourseLander';
import { createIncubatorWeekContent } from '../../components/lander/course-content/IncubatorWeekContent';
import {
  getProgramCoursePageStaticProps,
  type ProgramCoursePageProps,
} from '../../lib/programCoursePage';

const COURSE_SLUG = 'incubator-week';

const IncubatorWeekProgramPage = ({
  courseSlug,
  baseApplicationUrl,
  courseOgImage,
  soonestDeadline,
}: ProgramCoursePageProps) => {
  return (
    <CourseLander
      courseSlug={courseSlug}
      baseApplicationUrl={baseApplicationUrl}
      createContentFor={createIncubatorWeekContent}
      courseOgImage={courseOgImage}
      soonestDeadline={soonestDeadline}
      canonicalPath="/programs/incubator-week"
    />
  );
};

export const getStaticProps: GetStaticProps<ProgramCoursePageProps> = async () => {
  return getProgramCoursePageStaticProps(COURSE_SLUG);
};

IncubatorWeekProgramPage.pageRendersOwnNav = true;

export default IncubatorWeekProgramPage;
