import {
  Breadcrumbs, CTALinkOrButton, P, Section,
} from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../MarketingHero';
import { ROUTES } from '../../lib/routes';

type DraftGrantPageProps = {
  title: string;
  description: string;
  path: string;
  supportCopy: string;
  audienceCopy: string;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';

export const DraftGrantPage = ({
  title,
  description,
  path,
  supportCopy,
  audienceCopy,
}: DraftGrantPageProps) => (
  <div>
    <Head>
      <title>{`${title} | BlueDot Impact`}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={`${SITE_URL}${path}`} />
    </Head>

    <MarketingHero title={title} subtitle={description} />
    <Breadcrumbs
      route={{
        title,
        url: path,
        parentPages: [ROUTES.home, ROUTES.grants],
      }}
    />

    <Section title="What this grant supports">
      <P className="max-w-prose">
        {supportCopy}
      </P>
    </Section>

    <Section title="Who it's for">
      <P className="max-w-prose">
        {audienceCopy}
      </P>
    </Section>

    <Section title="How it works">
      <div className="flex max-w-prose flex-col gap-6">
        <P>
          Applications are not yet open. We&apos;ll add eligibility, funding, and process details here before launch.
        </P>
        <CTALinkOrButton disabled>
          Applications not yet open
        </CTALinkOrButton>
      </div>
    </Section>
  </div>
);

export default DraftGrantPage;
