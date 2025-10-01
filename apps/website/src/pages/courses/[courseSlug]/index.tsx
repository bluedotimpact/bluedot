import {
  Breadcrumbs,
  CTALinkOrButton,
  HeroCTAContainer,
  HeroH1,
  HeroSection,
} from '@bluedot/ui';
import Head from 'next/head';
import { GetStaticProps, GetStaticPaths } from 'next';
import { getAllActiveCourses } from '../../api/courses';
import { CourseAndUnits, getCourseData } from '../../api/courses/[courseSlug]';

import { ROUTES } from '../../../lib/routes';
import MarkdownExtendedRenderer from '../../../components/courses/MarkdownExtendedRenderer';
import FutureOfAiLander from '../../../components/lander/FutureOfAiLander';
import AiSafetyOpsLander from '../../../components/lander/AiSafetyOpsLander';
import AgiStrategyLander from '../../../components/lander/AgiStrategyLander';
import GraduateSection from '../../../components/homepage/GraduateSection';
import { CourseUnitsSection } from '../../../components/courses/CourseUnitsSection';

type CoursePageProps = {
  courseSlug: string;
  courseData: CourseAndUnits;
};

const CoursePage = ({ courseSlug, courseData }: CoursePageProps) => {
  return (
    <div>
      {courseData?.course && renderCoursePage({ slug: courseSlug, courseData })}
    </div>
  );
};

// Helper function to render the appropriate course page based on slug
const renderCoursePage = ({ slug, courseData }: { slug: string; courseData: CourseAndUnits; }) => {
  // Custom lander cases
  if (slug === 'future-of-ai') {
    return <FutureOfAiLander courseData={courseData} />;
  }

  if (slug === 'ops') {
    return <AiSafetyOpsLander />;
  }

  if (slug === 'agi-strategy') {
    return <AgiStrategyLander />;
  }

  // Default case
  return <StandardCoursePage courseData={courseData} />;
};

const StandardCoursePage = ({ courseData }: { courseData: CourseAndUnits }) => {
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

export const getStaticPaths: GetStaticPaths = async () => {
  const courses = await getAllActiveCourses();
  const paths = courses.map((course) => ({
    params: { courseSlug: course.slug },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<CoursePageProps> = async ({ params }) => {
  const courseSlug = params?.courseSlug as string;

  if (!courseSlug) {
    return {
      notFound: true,
    };
  }

  try {
    const courseData = await getCourseData(courseSlug);

    return {
      props: {
        courseSlug,
        courseData,
      },
      revalidate: 60,
    };
  } catch (error) {
    // Error fetching course data (likely not found)
    return {
      notFound: true,
    };
  }
};

export default CoursePage;
