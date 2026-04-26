import {
  addQueryParam,
  Breadcrumbs,
  CTALinkOrButton,
  useLatestUtmParams,
} from '@bluedot/ui';
import Head from 'next/head';
import { type GetStaticProps, type GetStaticPaths } from 'next';
import path from 'path';

import { ROUTES } from '../../../lib/routes';
import { ONE_MINUTE_SECONDS } from '../../../lib/constants';
import { appendPosthogSessionIdPrefill } from '../../../lib/appendPosthogSessionIdPrefill';
import MarketingHero from '../../../components/MarketingHero';
import NewsletterBanner from '../../../components/homepage/NewsletterBanner';
import { PageListGroup, PageListRow } from '../../../components/PageListRow';
import AiSafetyOpsLander from '../../../components/lander/AiSafetyOpsLander';
import CourseLander from '../../../components/lander/CourseLander';
import { createAgiStrategyContent } from '../../../components/lander/course-content/AgiStrategyContent';
import { createBioSecurityContent } from '../../../components/lander/course-content/BioSecurityContent';
import { createTechnicalAiSafetyContent } from '../../../components/lander/course-content/TechnicalAiSafetyContent';
import { createAiGovernanceContent } from '../../../components/lander/course-content/AiGovernanceContent';
import { createFutureOfAiContent, FUTURE_OF_AI_START_URL } from '../../../components/lander/course-content/FutureOfAiContent';
import { createPersonalTheoryOfImpactContent, PERSONAL_TOI_START_URL } from '../../../components/lander/course-content/PersonalTheoryOfImpactContent';
import { createTechnicalAiSafetyProjectContent } from '../../../components/lander/course-content/TechnicalAiSafetyProjectContent';
import { getCourseRoundsData, getSoonestDeadline } from '../../../server/routers/course-rounds';
import { createIncubatorWeekContent } from '../../../components/lander/course-content/IncubatorWeekContent';
import { getCourseData, type CourseAndUnits } from '../../../server/routers/courses';
import { fileExists } from '../../../utils/fileExists';

type CoursePageProps = {
  courseSlug: string;
  courseData: CourseAndUnits;
  courseOgImage: string;
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
  const baseApplicationUrl = course?.applyUrl ?? '';

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

  if (slug === 'personal-theory-of-impact') {
    // Personal Theory of Impact is self-paced, so use the start URL instead of an apply URL
    return (
      <CourseLander
        courseSlug={slug}
        baseApplicationUrl={PERSONAL_TOI_START_URL}
        createContentFor={createPersonalTheoryOfImpactContent}
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

const StandardCoursePage = ({ courseData, courseOgImage }: { courseData: CourseAndUnits; courseOgImage: string }) => {
  const { latestUtmParams } = useLatestUtmParams();
  const registerInterestUrlWithUtm = appendPosthogSessionIdPrefill(latestUtmParams.utm_source ? addQueryParam(registerInterestUrl, 'prefill_Source', latestUtmParams.utm_source) : registerInterestUrl);

  if (!courseData.course) {
    return null;
  }

  const { course, units } = courseData;
  const trimmedApplyUrl = course.applyUrl?.trim() ?? '';
  const hasApplyUrl = trimmedApplyUrl.length > 0;
  const applyUrl = hasApplyUrl ? trimmedApplyUrl : registerInterestUrlWithUtm;
  const ctaLabel = hasApplyUrl ? 'Apply now' : 'Register interest';

  return (
    <div>
      <Head>
        <title>{`${course.title} | BlueDot Impact`}</title>
        <meta name="description" content={course.shortDescription} />
        <meta key="og:title" property="og:title" content={course.title} />
        <meta key="og:description" property="og:description" content={course.shortDescription} />
        <meta key="og:site_name" property="og:site_name" content="BlueDot Impact" />
        <meta key="og:type" property="og:type" content="website" />
        <meta key="og:url" property="og:url" content={`https://bluedot.org/courses/${encodeURIComponent(course.slug)}`} />
        <meta key="og:image" property="og:image" content={courseOgImage} />
        <meta key="og:image:width" property="og:image:width" content="1200" />
        <meta key="og:image:height" property="og:image:height" content="630" />
        <meta key="og:image:type" property="og:image:type" content="image/png" />
        <meta key="og:image:alt" property="og:image:alt" content="BlueDot Impact logo" />
      </Head>

      <MarketingHero title={course.title} subtitle={course.shortDescription} />

      <Breadcrumbs
        route={{
          title: course.title,
          url: `/courses/${course.slug}`,
          parentPages: [ROUTES.home, ROUTES.courses],
        }}
      />

      <section className="section section-body">
        <div className="w-full min-[680px]:max-w-[840px] min-[680px]:mx-auto flex flex-col gap-8">
          <div className="flex flex-wrap gap-3">
            <CTALinkOrButton url={applyUrl} target="_blank">
              {ctaLabel}
            </CTALinkOrButton>
          </div>

          {units.length > 0 && (
            <PageListGroup label="Curriculum">
              {units.map((unit) => (
                <PageListRow
                  key={unit.id}
                  href={`/courses/${course.slug}/${unit.unitNumber}`}
                  title={unit.title}
                  summary={unit.description || undefined}
                  meta={`Unit ${unit.unitNumber}`}
                  ctaLabel="View unit"
                />
              ))}
            </PageListGroup>
          )}
        </div>
      </section>

      <div className="w-full max-w-max-width mx-auto px-spacing-x mt-spacing-y mb-16">
        <NewsletterBanner />
      </div>
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
      revalidate: ONE_MINUTE_SECONDS, // Cache 404s for only 1 minute instead of 1 year
    };
  }

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
        courseData,
        courseOgImage,
        soonestDeadline,
      },
      revalidate: 5 * ONE_MINUTE_SECONDS,
    };
  } catch {
    // Error fetching course data (likely not found)
    return {
      notFound: true,
      revalidate: ONE_MINUTE_SECONDS, // Cache 404s for only 1 minute instead of 1 year
    };
  }
};

CoursePage.pageRendersOwnNav = true;

export default CoursePage;
