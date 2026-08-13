import {
  Breadcrumbs, CTALinkOrButton,
} from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../components/MarketingHero';
import PageNewsletter from '../components/PageNewsletter';
import { GrantsList } from '../components/grants/GrantsList';
import { ROUTES } from '../lib/routes';

const GrantsPage = () => (
  <div>
    <Head>
      <title>Grants | BlueDot Impact</title>
      <meta
        name="description"
        content="Explore BlueDot Impact grants for career transitions, projects, and work that strengthens AI safety and biosecurity."
      />
    </Head>

    <MarketingHero
      title="Grants"
      subtitle="Funding for career transitions, projects, and other work that strengthens AI safety and biosecurity."
    />

    <Breadcrumbs route={ROUTES.grants} />

    <section className="section section-body">
      <div className="flex flex-col gap-12 lg:gap-14">
        <GrantsList />
      </div>

      <div className="flex justify-center pt-6 bd-md:pt-8 lg:pt-10">
        <CTALinkOrButton
          url={ROUTES.programs.url}
          className="px-4 bg-bluedot-navy/10 text-bluedot-navy hover:text-bluedot-navy text-size-sm font-medium tracking-tighter rounded-md hover:bg-bluedot-navy/15"
        >
          Explore in-person programs
        </CTALinkOrButton>
      </div>
    </section>

    <PageNewsletter />
  </div>
);

GrantsPage.pageRendersOwnNav = true;

export default GrantsPage;
