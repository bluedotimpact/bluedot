import {
  HeroSection,
  HeroH1,
  Breadcrumbs,
  CourseCard,
  Section,
  constants,
  ProgressDots,
} from '@bluedot/ui';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import Head from 'next/head';
import { ROUTES } from '../lib/routes';
import useAxios from 'axios-hooks';
import { GetCoursesResponse } from './api/courses';

const CURRENT_ROUTE = ROUTES.courses;

const CoursePage = () => {
  const [{ data, loading, error }] = useAxios<GetCoursesResponse>({
    method: 'get',
    url: '/api/courses',
  });

  return (
    <div>
      <Head>
        <title>AI safety courses with certificates</title>
        <meta name="description" content="Courses that support you to develop the knowledge, community and network needed to pursue a high-impact career." />
      </Head>
      <HeroSection>
        <HeroMiniTitle>{CURRENT_ROUTE.title}</HeroMiniTitle>
        <HeroH1>The expertise you need to shape safe AI</HeroH1>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section
        className="course-serp"
      >
        {loading && <ProgressDots />}
        <div className="course-serp__content grid sm:grid-cols-2 lg:grid-cols-4 gap-space-between items-stretch">
          {data?.courses.map((course) => (
            <div className="max-w-[350px]">
              <CourseCard
                key={course.title}
                title={course.title}
                description={course.description}
                imageSrc="/images/courses/future-of-ai.png"
                href={course.url}
                courseType="In-depth course"
                courseLength="2 hours"
              />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default CoursePage;
