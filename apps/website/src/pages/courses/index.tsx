import {
  HeroSection,
  HeroH1,
  Breadcrumbs,
  Section,
  ProgressDots,
  ErrorSection,
} from '@bluedot/ui';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { ROUTES } from '../../lib/routes';
import { GetCoursesResponse } from '../api/courses';
import { CourseSearchCard } from '../../components/courses/CourseSearchCard';

const CURRENT_ROUTE = ROUTES.courses;

const CoursePage = () => {
  const [{ data, loading, error }] = useAxios<GetCoursesResponse>({
    method: 'get',
    url: '/api/courses',
  });

  console.log({ data });

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
        {error && <ErrorSection error={error} />}
        <div className="course-serp__content flex flex-col gap-4 justify-center items-center mx-auto">
          {data?.courses.map((course) => (
            <CourseSearchCard
              key={course.title}
              description={course.shortDescription}
              cadence={course.cadence}
              level={course.level}
              averageRating={course.averageRating}
              imageSrc={course.image}
              title={course.title}
              url={course.path}
            />
          ))}
        </div>
      </Section>
    </div>
  );
};

export default CoursePage;
