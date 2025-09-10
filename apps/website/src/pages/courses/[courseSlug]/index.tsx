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
import AiSafetyOpsLander from '../../../components/lander/AiSafetyOpsLander';
import AgiStrategyLander from '../../../components/lander/AgiStrategyLander';
import GraduateSection from '../../../components/homepage/GraduateSection';
import { CourseUnitsSection } from '../../../components/courses/CourseUnitsSection';

const CoursePage = () => {
  const { query: { courseSlug } } = useRouter();

  if (typeof courseSlug !== 'string') {
    return <ProgressDots />;
  }

  const [{ data, loading, error }] = useAxios<GetCourseResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}`,
  });

  return (
    <div>
      {loading && <ProgressDots />}
      {error && <ErrorSection error={error} />}
      {data?.course && renderCoursePage(courseSlug, data)}
    </div>
  );
};

// Helper function to render the appropriate course page based on slug
const renderCoursePage = (slug: string, data: GetCourseResponse) => {
  // Custom lander cases
  if (slug === 'future-of-ai') {
    return <FutureOfAiLander courseData={data} />;
  }

  if (slug === 'ops') {
    return <AiSafetyOpsLander />;
  }

  if (slug === 'agi-strategy') {
    return <AgiStrategyLander />;
  }

  // Default case
  return <StandardCoursePage courseData={data} />;
};

const StandardCoursePage = ({ courseData }: { courseData: GetCourseResponse }) => {
  return (
    <div>
      {courseData.course && (
        <>
          <Head>
            <title>{`${courseData.course.title} | BlueDot Impact`}</title>
            <meta name="description" content={courseData.course.shortDescription} />
            <meta property="og:title" content={`${courseData.course.title} | BlueDot Impact`} />
            <meta property="og:description" content={courseData.course.shortDescription} />
            <meta property="og:image" content={`https://bluedot.org/api/og/course/${courseData.course.slug}`} />
            <meta property="og:url" content={`https://bluedot.org/courses/${courseData.course.slug}`} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:type" content="website" />

            {/* Twitter card tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={`${courseData.course.title} | BlueDot Impact`} />
            <meta name="twitter:description" content={courseData.course.shortDescription} />
            <meta name="twitter:image" content={`https://bluedot.org/api/og/course/${courseData.course.slug}`} />
          </Head>
          <HeroSection>
            <HeroH1>{courseData.course.title}</HeroH1>
            <MarkdownExtendedRenderer className="invert my-8">{courseData.course.description}</MarkdownExtendedRenderer>
            <div className="flex flex-row gap-4 justify-center items-center">
              {courseData.units?.[0]?.path && (
                <HeroCTAContainer>
                  <CTALinkOrButton url={courseData.units[0].path}>Browse the curriculum</CTALinkOrButton>
                </HeroCTAContainer>
              )}
              <HeroCTAContainer>
                <CTALinkOrButton url="https://web.miniextensions.com/aGd0mXnpcN1gfqlnYNZc">Register interest</CTALinkOrButton>
              </HeroCTAContainer>
            </div>
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
