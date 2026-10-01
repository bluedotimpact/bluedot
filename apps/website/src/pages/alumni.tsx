import { Breadcrumbs } from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../components/MarketingHero';
import GraduateSection from '../components/lander/components/GraduateSection';
import FeaturedAlumniStories from '../components/alumni/FeaturedAlumniStories';
import RecentAlumniList from '../components/alumni/RecentAlumniList';
import AlumniCta from '../components/alumni/AlumniCta';
import { ROUTES } from '../lib/routes';
import { pageMetaTags } from '../lib/linkPreviewMetaTags';

const TITLE = 'Alumni stories';
const DESCRIPTION = 'Where BlueDot alumni go, and the work they do on AI safety.';

const AlumniPage = () => {
  return (
    <div>
      <Head>
        {pageMetaTags({ title: `${TITLE} | BlueDot Impact`, description: DESCRIPTION })}
      </Head>
      <MarketingHero title={TITLE} />
      <Breadcrumbs route={ROUTES.alumni} />
      <GraduateSection />
      <FeaturedAlumniStories />
      <RecentAlumniList />
      <AlumniCta />
    </div>
  );
};

AlumniPage.pageRendersOwnNav = true;

export default AlumniPage;
