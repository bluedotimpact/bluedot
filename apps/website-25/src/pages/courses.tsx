import {
  HeroSection,
  HeroH1,
  Breadcrumbs,
  CourseCard,
  Section,
  constants,
} from '@bluedot/ui';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import Head from 'next/head';
import { ROUTES } from '../lib/routes';

const CURRENT_ROUTE = ROUTES.courses;

const CoursePage = () => {
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
        <div className="course-serp__content flex flex-row flex-wrap gap-space-between items-stretch">
          {constants.COURSES.map((course) => (
            <div className="max-w-[350px]">
              <CourseCard
                key={course.title}
                {...course}
              />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default CoursePage;
