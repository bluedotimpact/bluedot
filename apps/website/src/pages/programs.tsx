import {
  Breadcrumbs, CTALinkOrButton,
} from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../components/MarketingHero';
import PageNewsletter from '../components/PageNewsletter';
import { ProgramsList } from '../components/programs/ProgramsList';
import { ROUTES } from '../lib/routes';

const ProgramsPage = () => {
  return (
    <div>
      <Head>
        <title>Programs | BlueDot Impact</title>
        <meta
          name="description"
          content="Explore BlueDot Impact programs, including Rapid Grants, Incubator Week, and 1-1 advising."
        />
      </Head>

      <MarketingHero
        title="Programs"
        subtitle="Go beyond a course. Build, launch, get funded."
      />

      <Breadcrumbs route={ROUTES.programs} />

      <section className="section section-body">
        <div className="flex flex-col gap-12 lg:gap-14">
          <ProgramsList />
        </div>

        <div className="flex justify-center pt-6 bd-md:pt-8 lg:pt-10">
          <CTALinkOrButton
            url={ROUTES.courses.url}
            className="px-4 bg-bluedot-navy/10 text-bluedot-navy hover:text-bluedot-navy text-size-sm font-medium tracking-tighter rounded-md hover:bg-bluedot-navy/15"
          >
            Explore courses instead
          </CTALinkOrButton>
        </div>
      </section>

      <PageNewsletter />
    </div>
  );
};

ProgramsPage.pageRendersOwnNav = true;

export default ProgramsPage;
