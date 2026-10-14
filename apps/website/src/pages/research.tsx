import {
  Breadcrumbs,
  H2,
  ListGroup,
  ListRow,
  P,
} from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../components/MarketingHero';
import PageNewsletter from '../components/PageNewsletter';
import { pageMetaTags } from '../lib/linkPreviewMetaTags';
import { RESEARCH_AREAS, RESEARCH_SUPPORT } from '../lib/research';
import { ROUTES } from '../lib/routes';

const CURRENT_ROUTE = ROUTES.research;
const RESEARCH_SUBTITLE = 'Research is a core part of our work. It shapes what we teach, who we fund and which projects we launch.';

const ResearchPage = () => {
  return (
    <div>
      <Head>
        {pageMetaTags({ title: `${CURRENT_ROUTE.title} | BlueDot Impact`, description: RESEARCH_SUBTITLE })}
      </Head>
      <MarketingHero title="Research" subtitle={RESEARCH_SUBTITLE} />
      <Breadcrumbs route={CURRENT_ROUTE} />
      <section className="section section-body gap-12">
        {RESEARCH_AREAS.map((area) => (
          <section key={area.id} id={area.id} className="flex scroll-mt-28 flex-col gap-6">
            <div className="flex max-w-prose flex-col gap-2">
              <H2 className="text-size-lg">{area.title}</H2>
              <P>{area.description}</P>
            </div>
            <ListGroup>
              {area.items.map((item) => (
                <ListRow
                  key={item.url}
                  href={item.url}
                  title={item.title}
                  summary={item.summary}
                  meta={[item.authors, item.date, item.method].join(' · ')}
                  ctaLabel={item.ctaLabel ?? 'Read'}
                />
              ))}
            </ListGroup>
          </section>
        ))}
        <section id="research-we-support" className="flex scroll-mt-28 flex-col gap-6">
          <div className="flex max-w-prose flex-col gap-2">
            <H2 className="text-size-lg">Research we support</H2>
            <P>
              These projects belong to the people who run them.
              We help with funding, mentoring and a place to publish.
            </P>
          </div>
          <ListGroup>
            {RESEARCH_SUPPORT.map((link) => (
              <ListRow
                key={link.url}
                href={link.url}
                title={link.title}
                summary={link.summary}
                ctaLabel={link.ctaLabel}
              />
            ))}
          </ListGroup>
        </section>
      </section>
      <PageNewsletter />
    </div>
  );
};

ResearchPage.pageRendersOwnNav = true;

export default ResearchPage;
