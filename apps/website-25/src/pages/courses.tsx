import {
  HeroSection,
  HeroH1,
  Breadcrumbs,
  CourseCard,
  Section,
} from '@bluedot/ui';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import Head from 'next/head';
import { ROUTES } from '../lib/routes';

const CURRENT_ROUTE = ROUTES.courses;

const CoursePage = () => {
  return (
    <div>
      <Head>
        <title>{CURRENT_ROUTE.title} | BlueDot Impact</title>
        <meta name="description" content="Our mission is to ensure humanity safely navigates the transition to transformative AI." />
      </Head>
      <HeroSection>
        <HeroMiniTitle>{CURRENT_ROUTE.title}</HeroMiniTitle>
        <HeroH1>The expertise you need to shape safe AI</HeroH1>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section>
        <CourseCard
          title="Future of AI"
          description="No jargon, no coding, no pre-requisites – just bring your curiosity for how AI will reshape your world."
          imageSrc="/images/courses/future-of-ai.png"
          href={ROUTES.coursesFutureOfAi.url}
          courseType="Self-paced"
          courseLength="2 hours"
          cardType="Featured"
        />
      </Section>
    </div>
  );
};

export default CoursePage;
