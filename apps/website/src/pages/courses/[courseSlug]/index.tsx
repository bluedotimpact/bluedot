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
import { GetServerSideProps } from 'next';
import { courseTable, unitTable } from '@bluedot/db';

import { ROUTES } from '../../../lib/routes';
import db from '../../../lib/api/db';
import { unitFilterActiveChunks } from '../../../lib/api/utils';
import MarkdownExtendedRenderer from '../../../components/courses/MarkdownExtendedRenderer';
import FutureOfAiLander from '../../../components/lander/FutureOfAiLander';
import AiSafetyOpsLander from '../../../components/lander/AiSafetyOpsLander';
import AgiStrategyLander from '../../../components/lander/AgiStrategyLander';
import GraduateSection from '../../../components/homepage/GraduateSection';
import { CourseUnitsSection } from '../../../components/courses/CourseUnitsSection';

export type GetCourseResponse = {
  type: 'success',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  course: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  units: any[],
};

type CoursePageProps = {
  courseSlug: string;
  courseData: GetCourseResponse | null;
  error?: string;
};

const CoursePage = ({ courseSlug, courseData, error }: CoursePageProps) => {
  if (error) {
    return <ErrorSection error={{ message: error }} />;
  }

  if (!courseData) {
    return <ProgressDots />;
  }

  return renderCoursePage(courseSlug, courseData);
};

// Helper function to get metadata for each course
const getCourseMetadata = (slug: string, data: GetCourseResponse) => {
  // Use customDescription if available, otherwise fall back to shortDescription
  return {
    title: data.course?.title || '',
    description: data.course?.shortDescription || '',
  };
};

// Helper function to render the appropriate course page based on slug
const renderCoursePage = (slug: string, data: GetCourseResponse) => {
  const metadata = getCourseMetadata(slug, data);

  return (
    <>
      <Head>
        <title>{`${metadata.title} | BlueDot Impact`}</title>
        <meta name="description" content={metadata.description} />
        <meta property="og:title" content={`${metadata.title} | BlueDot Impact`} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:image" content={`https://bluedot.org/api/og/course/${slug}`} />
        <meta property="og:url" content={`https://bluedot.org/courses/${slug}`} />
        <meta property="og:type" content="website" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${metadata.title} | BlueDot Impact`} />
        <meta name="twitter:description" content={metadata.description} />
        <meta name="twitter:image" content={`https://bluedot.org/api/og/course/${slug}`} />
      </Head>

      {/* Render the appropriate component based on slug */}
      {slug === 'future-of-ai' && <FutureOfAiLander courseData={data} />}
      {slug === 'ops' && <AiSafetyOpsLander />}
      {slug === 'agi-strategy' && <AgiStrategyLander />}
      {!['future-of-ai', 'ops', 'agi-strategy'].includes(slug) && <StandardCoursePage courseData={data} />}
    </>
  );
};

const StandardCoursePage = ({ courseData }: { courseData: GetCourseResponse }) => {
  return (
    <div>
      {courseData.course && (
        <>
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { courseSlug } = context.params as { courseSlug: string };

  try {
    // Fetch course data from database for all courses
    const course = await db.get(courseTable, { slug: courseSlug });

    if (!course) {
      return {
        notFound: true,
      };
    }

    // Get units for this course with active status
    const allUnitsWithAllChunks = await db.scan(unitTable, { courseSlug, unitStatus: 'Active' });
    const allUnits = await unitFilterActiveChunks({ units: allUnitsWithAllChunks, db });
    const units = allUnits.sort((a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || ''));

    return {
      props: {
        courseSlug,
        courseData: {
          type: 'success',
          course,
          units,
        },
      },
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching course data:', error);
    return {
      props: {
        courseSlug,
        courseData: null,
        error: 'Failed to load course data',
      },
    };
  }
};

export default CoursePage;
