import {
  Breadcrumbs,
  HeroH1,
  HeroSection,
  Section,
} from '@bluedot/ui';
import Head from 'next/head';
import { ROUTES } from '../lib/routes';

const CURRENT_ROUTE = ROUTES.contact;

const ContactPage = () => {
  return (
    <div>
      <Head>
        <title>Contact us | BlueDot Impact</title>
        <meta name="description" content="Contact BlueDot Impact, the team behind AI Safety Fundamentals." />
      </Head>
      <HeroSection>
        <HeroH1>Contact us</HeroH1>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section className="contact-section" title="How to get in touch">
        <div className="contact-section__container grid lg:grid-cols-2 gap-8">
          <div className="contact-section__text-container flex flex-col gap-space-between">
            <p>We’re BlueDot Impact, the team behind AI Safety Fundamentals. You can find more about us on our <a href={ROUTES.home.url}>homepage</a>.</p>
            <p>We love hearing from people, and are keen for people to reach out to us with any questions or feedback!</p>
            <p>Email us at <a href="mailto:team@bluedot.org">team@bluedot.org</a>.</p>
          </div>
          <img className="contact-section__image order-first lg:order-last w-full rounded-2xl" src="/images/team/team_2.jpg" alt="BlueDot Impact team" />
        </div>
      </Section>
    </div>
  );
};

export default ContactPage;
