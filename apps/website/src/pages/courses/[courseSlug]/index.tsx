import {
  Breadcrumbs,
  CTALinkOrButton,
  useLatestUtmParams,
} from '@bluedot/ui';
import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useFeatureFlagVariantKey } from 'posthog-js/react';
import { type GetStaticProps, type GetStaticPaths } from 'next';

import { ROUTES } from '../../../lib/routes';
import { COURSE_CONFIG, ONE_MINUTE_SECONDS } from '../../../lib/constants';
import { getCourseOgImage } from '../../../lib/courseOgImage';
import { buildApplicationUrl } from '../../../lib/utils';
import MarketingHero from '../../../components/MarketingHero';
import PageNewsletter from '../../../components/PageNewsletter';
import { PageListGroup, PageListRow } from '../../../components/PageListRow';
import { CourseIcon } from '../../../components/courses/CourseIcon';
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
import { getCourseData, type CourseAndUnits } from '../../../server/routers/courses';

type CoursePageProps = {
  courseSlug: string;
  courseData: CourseAndUnits;
  courseOgImage: string;
  soonestDeadline: string | null;
};

const CoursePage = ({
  courseSlug, courseData, courseOgImage, soonestDeadline,
}: CoursePageProps) => {
  const router = useRouter();
  const skipLanderVariant = useFeatureFlagVariantKey('future-of-ai-skip-lander');

  useEffect(() => {
    if (courseSlug === 'future-of-ai' && skipLanderVariant === 'skip-lander') {
      void router.replace(FUTURE_OF_AI_START_URL);
    }
  }, [courseSlug, skipLanderVariant, router]);

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

  if (COURSE_CONFIG[slug]?.externalCoursePage) {
    return <ExternalCoursePage courseData={courseData} courseOgImage={courseOgImage} />;
  }

  // Default case
  return <StandardCoursePage courseData={courseData} courseOgImage={courseOgImage} />;
};

const registerInterestUrl = 'https://web.miniextensions.com/aGd0mXnpcN1gfqlnYNZc';

const ExternalCoursePage = ({ courseData, courseOgImage }: { courseData: CourseAndUnits; courseOgImage: string }) => {
  if (!courseData.course) {
    return null;
  }

  const { course, units } = courseData;
  const externalCoursePage = COURSE_CONFIG[course.slug]?.externalCoursePage;
  const firstUnit = units[0];
  const curriculumUrl = firstUnit ? `/courses/${course.slug}/${firstUnit.unitNumber}/1` : undefined;

  if (!externalCoursePage) {
    return null;
  }

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
        <meta key="og:image:alt" property="og:image:alt" content={`${course.title} course preview`} />
      </Head>

      <Breadcrumbs
        route={{
          title: course.title,
          url: `/courses/${course.slug}`,
          parentPages: [ROUTES.home, ROUTES.courses],
        }}
      />

      <section className="section section-body">
        <div className="w-full bd-md:max-w-text bd-md:mx-auto flex flex-col gap-8">
          <div className="flex flex-col gap-5">
            <CourseIcon courseSlug={course.slug} size="xlarge" className="rounded-xl" />
            <div className="flex flex-col gap-4">
              <p className="text-size-xxs leading-[14px] font-semibold text-bluedot-normal uppercase tracking-[0.5px]">
                External course from {externalCoursePage.providerName}
              </p>
              <h1 className="text-size-xl bd-md:text-size-2xl leading-[1.15] font-semibold tracking-[-0.02em] text-bluedot-navy">
                {course.title}
              </h1>
              <p className="text-size-md leading-[1.6] text-bluedot-navy/80">
                {course.shortDescription}
              </p>
              <p className="text-size-sm leading-[1.6] text-bluedot-navy/70">
                {externalCoursePage.summary}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {curriculumUrl && (
              <CTALinkOrButton url={curriculumUrl} withChevron>
                {externalCoursePage.curriculumCtaLabel}
              </CTALinkOrButton>
            )}
            <CTALinkOrButton url={externalCoursePage.detailsUrl} target="_blank" variant="secondary">
              {externalCoursePage.detailsCtaLabel}
            </CTALinkOrButton>
          </div>

          <p className="text-size-xs leading-[1.6] text-bluedot-navy/60">
            Questions about the course? Contact{' '}
            <a href="mailto:online-course@digitalminds.cam" className="text-bluedot-normal underline">
              online-course@digitalminds.cam
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
};

const StandardCoursePage = ({ courseData, courseOgImage }: { courseData: CourseAndUnits; courseOgImage: string }) => {
  const { latestUtmParams } = useLatestUtmParams();
  const registerInterestUrlWithUtm = buildApplicationUrl(registerInterestUrl, latestUtmParams.utm_source);

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
        <div className="w-full bd-md:max-w-text bd-md:mx-auto flex flex-col gap-8">
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
                  meta={`Unit ${unit.unitNumber}`}
                  ctaLabel="View unit"
                />
              ))}
            </PageListGroup>
          )}
        </div>
      </section>

      <PageNewsletter />
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

    const courseOgImage = await getCourseOgImage(courseSlug);

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
