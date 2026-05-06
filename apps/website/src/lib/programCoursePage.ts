import type { GetStaticPropsResult } from 'next';
import { ONE_MINUTE_SECONDS } from './constants';
import { getCourseOgImage } from './courseOgImage';
import { getCourseRoundsData, getSoonestDeadline } from '../server/routers/course-rounds';
import { getCourseData } from '../server/routers/courses';

export type ProgramCoursePageProps = {
  courseSlug: string;
  baseApplicationUrl: string;
  courseOgImage: string;
  soonestDeadline: string | null;
};

export const getProgramCoursePageStaticProps = async (courseSlug: string): Promise<GetStaticPropsResult<ProgramCoursePageProps>> => {
  try {
    const courseData = await getCourseData(courseSlug);
    const rounds = await getCourseRoundsData(courseSlug);
    const soonestDeadline = getSoonestDeadline(rounds);

    const courseOgImage = await getCourseOgImage(courseSlug);

    return {
      props: {
        courseSlug,
        baseApplicationUrl: courseData.course?.applyUrl ?? '',
        courseOgImage,
        soonestDeadline,
      },
      revalidate: 5 * ONE_MINUTE_SECONDS,
    };
  } catch {
    return {
      notFound: true,
      revalidate: ONE_MINUTE_SECONDS,
    };
  }
};
