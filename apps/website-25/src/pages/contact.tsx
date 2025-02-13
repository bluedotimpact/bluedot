import {
  HeroSection,
  Section,
} from '@bluedot/ui';
import Head from 'next/head';

const ContactPage = () => {
  return (
    <div>
      <Head>
        <title>Contact us | BlueDot Impact</title>
        <meta name="description" content="Contact BlueDot Impact, the team behind AI Safety Fundamentals." />
      </Head>
      <HeroSection
        title="Reach out to our team"
      />
      <Section className="intro-section" title="Contact us">
        <div className="intro-section__container flex lg:flex-row flex-col gap-space-between">
          <div className="intro-section__text-container flex flex-col gap-5">
            <p>We're BlueDot Impact, the team behind AI Safety Fundamentals. We love hearing from people, and are keen for people to reach out to us with any questions or feedback!</p>
            <p>Email us at <a href="mailto:team@bluedot.org">team@bluedot.org</a>.</p>
          </div>
          <img className="intro-section__image max-w-[570px] w-full h-auto rounded-2xl" src="/images/team/team_1.jpg" alt="BlueDot Impact team" />
        </div>
      </Section>
    </div>
  );
};

export default ContactPage;
