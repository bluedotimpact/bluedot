import path from 'path';
import type { GetStaticPropsResult } from 'next';
import { ONE_MINUTE_SECONDS } from './constants';
import { getCourseRoundsData, getSoonestDeadline } from '../server/routers/course-rounds';
import { getCourseData } from '../server/routers/courses';
import { fileExists } from '../utils/fileExists';

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

    let courseOgImage = 'https://bluedot.org/images/logo/link-preview-fallback.png';
    if (await fileExists(path.join(process.cwd(), 'public', 'images', 'courses', 'link-preview', `${courseSlug}.png`))) {
      courseOgImage = `${process.env.NEXT_PUBLIC_SITE_URL}/images/courses/link-preview/${courseSlug}.png`;
    }

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
