import {
  Breadcrumbs,
  Section,
} from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../components/MarketingHero';
import MarkdownExtendedRenderer from '../components/courses/MarkdownExtendedRenderer';
import { ROUTES } from '../lib/routes';

const CURRENT_ROUTE = ROUTES.contact;
const SUBTITLE = 'How to reach us and details about our nonprofit entities.';

const ContactPage = () => {
  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="Contact details and legal registration information for BlueDot Impact's UK and US entities."
        />
      </Head>
      <MarketingHero title={CURRENT_ROUTE.title} subtitle={SUBTITLE} />
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section className="max-w-3xl">
        <MarkdownExtendedRenderer>{`
## Contact

We love hearing from people. For general questions or feedback, email [team@bluedot.org](mailto:team@bluedot.org).

## Legal information

BlueDot Impact operates through two nonprofit entities.

### United Kingdom

**BlueDot Impact Ltd** is a private company limited by guarantee without share capital, registered in England and Wales.

- Company number: [14964572](https://find-and-update.company-information.service.gov.uk/company/14964572)
- Registered office: 71-75 Shelton Street, Covent Garden, London, United Kingdom, WC2H 9JQ

### United States

**BlueDot Impact US Inc** is a tax-exempt nonprofit organisation recognised under section 501(c)(3) of the US Internal Revenue Code.

- Employer Identification Number (EIN): [99-4885308](https://projects.propublica.org/nonprofits/organizations/994885308)
`}
        </MarkdownExtendedRenderer>
      </Section>
    </div>
  );
};

ContactPage.pageRendersOwnNav = true;

export default ContactPage;
