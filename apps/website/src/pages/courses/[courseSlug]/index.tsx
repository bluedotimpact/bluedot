import {
  addQueryParam,
  Breadcrumbs,
  CTALinkOrButton,
  HeroCTAContainer,
  HeroH1,
  HeroSection,
  useLatestUtmParams,
} from '@bluedot/ui';
import Head from 'next/head';
import { GetStaticProps, GetStaticPaths } from 'next';

import { ROUTES } from '../../../lib/routes';
import MarkdownExtendedRenderer from '../../../components/courses/MarkdownExtendedRenderer';
import FutureOfAiLander from '../../../components/lander/FutureOfAiLander';
import AiSafetyOpsLander from '../../../components/lander/AiSafetyOpsLander';
import CourseLander from '../../../components/lander/CourseLander';
import { createAgiStrategyContent, AGI_STRATEGY_APPLICATION_URL } from '../../../components/lander/course-content/AgiStrategyContent';
import { createBioSecurityContent, BIOSECURITY_APPLICATION_URL } from '../../../components/lander/course-content/BioSecurityContent';
import { createTechnicalAiSafetyContent, TECHNICAL_AI_SAFETY_APPLICATION_URL } from '../../../components/lander/course-content/TechnicalAiSafetyContent';
import GraduateSection from '../../../components/homepage/GraduateSection';
import { CourseUnitsSection } from '../../../components/courses/CourseUnitsSection';
import { getCourseData, type CourseAndUnits } from '../../../server/routers/courses';

type CoursePageProps = {
  courseSlug: string;
  courseData: CourseAndUnits
};

const CoursePage = ({ courseSlug, courseData }: CoursePageProps) => {
  return (
    <div>
      {renderCoursePage({ courseSlug, courseData })}
    </div>
  );
};

// Helper function to render the appropriate course page based on slug
const renderCoursePage = ({ courseSlug: slug, courseData }: CoursePageProps) => {
  // Custom lander cases
  if (slug === 'future-of-ai') {
    return <FutureOfAiLander courseData={courseData} />;
  }

  if (slug === 'ops') {
    return <AiSafetyOpsLander />;
  }

  if (slug === 'agi-strategy') {
    return (
      <CourseLander
        courseSlug={slug}
        baseApplicationUrl={AGI_STRATEGY_APPLICATION_URL}
        createContentFor={createAgiStrategyContent}
      />
    );
  }

  if (slug === 'biosecurity') {
    return (
      <CourseLander
        courseSlug={slug}
        baseApplicationUrl={BIOSECURITY_APPLICATION_URL}
        createContentFor={createBioSecurityContent}
      />
    );
  }

  if (slug === 'technical-ai-safety') {
    return (
      <CourseLander
        courseSlug={slug}
        baseApplicationUrl={TECHNICAL_AI_SAFETY_APPLICATION_URL}
        createContentFor={createTechnicalAiSafetyContent}
      />
    );
  }

  // Default case
  return <StandardCoursePage courseData={courseData} />;
};

const registerInterestUrl = 'https://web.miniextensions.com/aGd0mXnpcN1gfqlnYNZc';

const StandardCoursePage = ({ courseData }: { courseData: CoursePageProps['courseData'] }) => {
  const { latestUtmParams } = useLatestUtmParams();
  const registerInterestUrlWithUtm = latestUtmParams.utm_source ? addQueryParam(registerInterestUrl, 'prefill_Source', latestUtmParams.utm_source) : registerInterestUrl;

  return (
    <div>
      {courseData.course && (
        <>
          <Head>
            <title>{`${courseData.course.title} | BlueDot Impact`}</title>
            <meta name="description" content={courseData.course.description} />
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
                <CTALinkOrButton url={registerInterestUrlWithUtm}>Register interest</CTALinkOrButton>
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

export const getStaticPaths: GetStaticPaths = async () => {
  // CI is not currently set up to support connecting to the database at build
  // time, so return no paths, and rely on `fallback: 'blocking'` to render the pages on demand.
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<CoursePageProps> = async ({ params }) => {
  const courseSlug = params?.courseSlug as string;

  if (!courseSlug) {
    return {
      notFound: true,
      revalidate: 60, // Cache 404s for only 1 minute instead of 1 year
    };
  }

  try {
    const courseData = await getCourseData(courseSlug);

    return {
      props: {
        courseSlug,
        courseData,
      },
      revalidate: 300,
    };
  } catch (error) {
    // Error fetching course data (likely not found)
    return {
      notFound: true,
      revalidate: 60, // Cache 404s for only 1 minute instead of 1 year
    };
  }
};

export default CoursePage;
