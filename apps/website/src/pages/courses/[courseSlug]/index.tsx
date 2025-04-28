import {
  Breadcrumbs,
  CTALinkOrButton,
  ErrorSection,
  HeroCTAContainer,
  HeroH1,
  HeroSection,
  ProgressDots,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { useRouter } from 'next/router';

import { ROUTES } from '../../../lib/routes';
import { GetCourseResponse } from '../../api/courses/[courseSlug]';
import MarkdownExtendedRenderer from '../../../components/courses/MarkdownExtendedRenderer';
import FutureOfAiLander from '../../../components/lander/FutureOfAiLander';
import GraduateSection from '../../../components/homepage/GraduateSection';
import { CourseUnitsSection } from '../../../components/courses/CourseUnitsSection';

const CoursePage = () => {
  const { query: { courseSlug } } = useRouter();

  const [{ data, loading, error }] = useAxios<GetCourseResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}`,
  });

  return (
    <div>
      {loading && <ProgressDots />}
      {error && <ErrorSection error={error} />}
      {data?.course && (
        // Custom lander case for Future of AI
        courseSlug === 'future-of-ai' ? (
          <FutureOfAiLander courseData={data} />
        ) : (
          <StandardCoursePage courseData={data} />
        )
      )}
    </div>
  );
};

const StandardCoursePage = ({ courseData }: { courseData: GetCourseResponse }) => {
  return (
    <div>
      {courseData?.course && (
        <>
          <Head>
            <title>{`${courseData?.course.title} | BlueDot Impact`}</title>
            <meta name="description" content={courseData?.course.description} />
          </Head>
          <HeroSection>
            <HeroH1>{courseData.course.title}</HeroH1>
            <MarkdownExtendedRenderer className="invert my-8">{courseData.course.description}</MarkdownExtendedRenderer>
            {courseData.units?.[0]?.path && (
              <HeroCTAContainer>
                <CTALinkOrButton url={courseData.units[0].path}>Browse the curriculum for free</CTALinkOrButton>
              </HeroCTAContainer>
            )}
          </HeroSection>
          <Breadcrumbs
            className="course-serp__breadcrumbs"
            route={{
              title: courseData.course.title,
              url: courseData.course.path,
              parentPages: [ROUTES.home, ROUTES.courses],
            }}
          />
          <GraduateSection />
          <CourseUnitsSection units={courseData.units} />
        </>
      )}
    </div>
  );
};

export default CoursePage;
