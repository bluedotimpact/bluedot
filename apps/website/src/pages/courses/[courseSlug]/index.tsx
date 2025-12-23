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
import path from 'path';

import { ROUTES } from '../../../lib/routes';
import MarkdownExtendedRenderer from '../../../components/courses/MarkdownExtendedRenderer';
import AiSafetyOpsLander from '../../../components/lander/AiSafetyOpsLander';
import CourseLander from '../../../components/lander/CourseLander';
import { createAgiStrategyContent, AGI_STRATEGY_APPLICATION_URL } from '../../../components/lander/course-content/AgiStrategyContent';
import { createBioSecurityContent, BIOSECURITY_APPLICATION_URL } from '../../../components/lander/course-content/BioSecurityContent';
import { createTechnicalAiSafetyContent, TECHNICAL_AI_SAFETY_APPLICATION_URL } from '../../../components/lander/course-content/TechnicalAiSafetyContent';
import { createAiGovernanceContent, AI_GOVERNANCE_APPLICATION_URL } from '../../../components/lander/course-content/AiGovernanceContent';
import { createFutureOfAiContent, FUTURE_OF_AI_START_URL } from '../../../components/lander/course-content/FutureOfAiContent';
import { createTechnicalAiSafetyProjectContent, TECHNICAL_AI_SAFETY_PROJECT_APPLICATION_URL } from '../../../components/lander/course-content/TechnicalAiSafetyProjectContent';
import GraduateSection from '../../../components/lander/components/GraduateSection';
import { CourseUnitsSection } from '../../../components/courses/CourseUnitsSection';
import { getCourseData, type CourseAndUnits } from '../../../server/routers/courses';
import { fileExists } from '../../../utils/fileExists';

type CoursePageProps = {
  courseSlug: string;
  courseData: CourseAndUnits;
  courseOgImage?: string | null
};

const CoursePage = ({ courseSlug, courseData, courseOgImage }: CoursePageProps) => {
  return (
    <div>
      {renderCoursePage({ courseSlug, courseData, courseOgImage })}
    </div>
  );
};

// Helper function to render the appropriate course page based on slug
const renderCoursePage = ({ courseSlug: slug, courseData, courseOgImage }: CoursePageProps) => {
  // Custom lander cases
  if (slug === 'future-of-ai') {
    return (
      <CourseLander
        courseSlug={slug}
        baseApplicationUrl={FUTURE_OF_AI_START_URL}
        createContentFor={createFutureOfAiContent}
        courseOgImage={courseOgImage}
      />
    );
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
        courseOgImage={courseOgImage}
      />
    );
  }

  if (slug === 'biosecurity') {
    return (
      <CourseLander
        courseSlug={slug}
        baseApplicationUrl={BIOSECURITY_APPLICATION_URL}
        createContentFor={createBioSecurityContent}
        courseOgImage={courseOgImage}
      />
    );
  }

  if (slug === 'technical-ai-safety') {
    return (
      <CourseLander
        courseSlug={slug}
        baseApplicationUrl={TECHNICAL_AI_SAFETY_APPLICATION_URL}
        createContentFor={createTechnicalAiSafetyContent}
        courseOgImage={courseOgImage}
      />
    );
  }

  if (slug === 'ai-governance') {
    return (
      <CourseLander
        courseSlug={slug}
        baseApplicationUrl={AI_GOVERNANCE_APPLICATION_URL}
        createContentFor={createAiGovernanceContent}
        courseOgImage={courseOgImage}
      />
    );
  }

  if (slug === 'technical-ai-safety-project') {
    return (
      <CourseLander
        courseSlug={slug}
        baseApplicationUrl={TECHNICAL_AI_SAFETY_PROJECT_APPLICATION_URL}
        createContentFor={createTechnicalAiSafetyProjectContent}
        courseOgImage={courseOgImage}
      />
    );
  }
  // Default case
  return <StandardCoursePage courseData={courseData} courseOgImage={courseOgImage} />;
};

const registerInterestUrl = 'https://web.miniextensions.com/aGd0mXnpcN1gfqlnYNZc';

const StandardCoursePage = ({ courseData, courseOgImage }: { courseData: CourseAndUnits, courseOgImage?: string | null }) => {
  const { latestUtmParams } = useLatestUtmParams();
  const registerInterestUrlWithUtm = latestUtmParams.utm_source ? addQueryParam(registerInterestUrl, 'prefill_Source', latestUtmParams.utm_source) : registerInterestUrl;

  return (
    <div>
      {courseData.course && (
        <>
          <Head>
            <title>{`${courseData.course.title} | BlueDot Impact`}</title>
            <meta name="description" content={courseData.course.description} />
            <meta key="og:title" property="og:title" content={courseData.course.title} />
            <meta key="og:description" property="og:description" content={courseData.course.shortDescription} />
            <meta key="og:site_name" property="og:site_name" content="BlueDot Impact" />
            <meta key="og:type" property="og:type" content="website" />
            <meta key="og:url" property="og:url" content={`https://bluedot.org/courses/${encodeURIComponent(courseData.course.slug)}`} />
            <meta key="og:image" property="og:image" content={courseOgImage || 'https://bluedot.org/images/logo/link-preview-fallback.png'} />
            <meta key="og:image:width" property="og:image:width" content="1200" />
            <meta key="og:image:height" property="og:image:height" content="630" />
            <meta key="og:image:type" property="og:image:type" content="image/png" />
            <meta key="og:image:alt" property="og:image:alt" content="BlueDot Impact logo" />
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

    let courseOgImage: string | null = null;
    if (await fileExists(path.join(process.cwd(), 'public', 'images', 'courses', 'link-preview', `${courseSlug}.png`))) {
      courseOgImage = `${process.env.NEXT_PUBLIC_SITE_URL}/images/courses/link-preview/${courseSlug}.png`;
    }

    return {
      props: {
        courseSlug,
        courseData,
        courseOgImage,
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
