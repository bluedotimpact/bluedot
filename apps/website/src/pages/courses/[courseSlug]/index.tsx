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
import { type GetStaticProps, type GetStaticPaths } from 'next';
import path from 'path';

import { ROUTES } from '../../../lib/routes';
import MarkdownExtendedRenderer from '../../../components/courses/MarkdownExtendedRenderer';
import AiSafetyOpsLander from '../../../components/lander/AiSafetyOpsLander';
import CourseLander from '../../../components/lander/CourseLander';
import { createAgiStrategyContent } from '../../../components/lander/course-content/AgiStrategyContent';
import { createBioSecurityContent } from '../../../components/lander/course-content/BioSecurityContent';
import { createTechnicalAiSafetyContent } from '../../../components/lander/course-content/TechnicalAiSafetyContent';
import { createAiGovernanceContent } from '../../../components/lander/course-content/AiGovernanceContent';
import { createFutureOfAiContent, FUTURE_OF_AI_START_URL } from '../../../components/lander/course-content/FutureOfAiContent';
import { createTechnicalAiSafetyProjectContent } from '../../../components/lander/course-content/TechnicalAiSafetyProjectContent';
import { getCourseRoundsData, getSoonestDeadline } from '../../../server/routers/course-rounds';
import { createIncubatorWeekContent } from '../../../components/lander/course-content/IncubatorWeekContent';
import GraduateSection from '../../../components/lander/components/GraduateSection';
import { CourseUnitsSection } from '../../../components/courses/CourseUnitsSection';
import { getCourseData, type CourseAndUnits } from '../../../server/routers/courses';
import { fileExists } from '../../../utils/fileExists';

type CoursePageProps = {
  courseSlug: string;
  courseData: CourseAndUnits;
  courseOgImage?: string | null;
  soonestDeadline: string | null;
};

const CoursePage = ({
  courseSlug, courseData, courseOgImage, soonestDeadline,
}: CoursePageProps) => {
  return (
    <div>
      {renderCoursePage({
        courseSlug, courseData, courseOgImage, soonestDeadline,
      })}
    </div>
  );
};

// Helper function to render the appropriate course page based on slug
const renderCoursePage = ({
  courseSlug: slug, courseData, courseOgImage, soonestDeadline,
}: CoursePageProps) => {
  const { course } = courseData;
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const baseApplicationUrl = course?.applyUrl || '';

  if (slug === 'future-of-ai') {
    // Future of AI is self-paced, so use the start URL instead of an apply URL
    return (
      <CourseLander
        courseSlug={slug}
        baseApplicationUrl={FUTURE_OF_AI_START_URL}
        createContentFor={createFutureOfAiContent}
        courseOgImage={courseOgImage}
        soonestDeadline={soonestDeadline}
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
        baseApplicationUrl={baseApplicationUrl}
        createContentFor={createAgiStrategyContent}
        courseOgImage={courseOgImage}
        soonestDeadline={soonestDeadline}
      />
    );
  }

  if (slug === 'biosecurity') {
    return (
      <CourseLander
        courseSlug={slug}
        baseApplicationUrl={baseApplicationUrl}
        createContentFor={createBioSecurityContent}
        courseOgImage={courseOgImage}
        soonestDeadline={soonestDeadline}
      />
    );
  }

  if (slug === 'technical-ai-safety') {
    return (
      <CourseLander
        courseSlug={slug}
        baseApplicationUrl={baseApplicationUrl}
        createContentFor={createTechnicalAiSafetyContent}
        courseOgImage={courseOgImage}
        soonestDeadline={soonestDeadline}
      />
    );
  }

  if (slug === 'ai-governance') {
    return (
      <CourseLander
        courseSlug={slug}
        baseApplicationUrl={baseApplicationUrl}
        createContentFor={createAiGovernanceContent}
        courseOgImage={courseOgImage}
        soonestDeadline={soonestDeadline}
      />
    );
  }

  if (slug === 'technical-ai-safety-project') {
    return (
      <CourseLander
        courseSlug={slug}
        baseApplicationUrl={baseApplicationUrl}
        createContentFor={createTechnicalAiSafetyProjectContent}
        courseOgImage={courseOgImage}
        soonestDeadline={soonestDeadline}
      />
    );
  }

  if (slug === 'incubator-week') {
    return (
      <CourseLander
        courseSlug={slug}
        baseApplicationUrl={baseApplicationUrl}
        createContentFor={createIncubatorWeekContent}
        courseOgImage={courseOgImage}
        soonestDeadline={soonestDeadline}
      />
    );
  }

  // Default case
  return <StandardCoursePage courseData={courseData} courseOgImage={courseOgImage} />;
};

const registerInterestUrl = 'https://web.miniextensions.com/aGd0mXnpcN1gfqlnYNZc';

const StandardCoursePage = ({ courseData, courseOgImage }: { courseData: CourseAndUnits; courseOgImage?: string | null }) => {
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
            {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
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

    const rounds = await getCourseRoundsData(courseSlug);
    const soonestDeadline = getSoonestDeadline(rounds);

    let courseOgImage: string | null = null;
    if (await fileExists(path.join(process.cwd(), 'public', 'images', 'courses', 'link-preview', `${courseSlug}.png`))) {
      courseOgImage = `${process.env.NEXT_PUBLIC_SITE_URL}/images/courses/link-preview/${courseSlug}.png`;
    }

    return {
      props: {
        courseSlug,
        courseData,
        courseOgImage,
        soonestDeadline,
      },
      revalidate: 300,
    };
  } catch {
    // Error fetching course data (likely not found)
    return {
      notFound: true,
      revalidate: 60, // Cache 404s for only 1 minute instead of 1 year
    };
  }
};

export default CoursePage;
