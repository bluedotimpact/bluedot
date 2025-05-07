import {
  Breadcrumbs,
  HeroSection,
} from '@bluedot/ui';
import Head from 'next/head';
import { HeroH1, HeroH2, HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import { ROUTES } from '../../lib/routes';
import ProjectsListSection from '../../components/projects/ProjectsListSection';

const CURRENT_ROUTE = ROUTES.projects;

const ProjectsPage = () => {
  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="description" content="Insights and updates from BlueDot Impact" />
      </Head>
      <HeroSection>
        <HeroMiniTitle>Projects</HeroMiniTitle>
        <HeroH1>Top projects from our students</HeroH1>
        <HeroH2>Participants worked on these projects for 4 weeks, applying their learnings from the course to their next steps</HeroH2>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <ProjectsListSection />
    </div>
  );
};

export default ProjectsPage;
