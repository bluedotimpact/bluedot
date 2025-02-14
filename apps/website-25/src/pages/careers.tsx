import {
  HeroSection,
  HeroH1,
  HeroCTAContainer,
  CTALinkOrButton,
} from '@bluedot/ui';
import Head from 'next/head';
import CareersSection from '../components/careers/CareersSection';
import CultureSection from '../components/careers/CultureSection';
import ValuesSection from '../components/careers/ValuesSection';

const CareersPage = () => {
  return (
    <div>
      <Head>
        <title>Join the team at BlueDot Impact</title>
        <meta name="description" content="Join us in our mission to ensure humanity safely navigates the transition to transformative AI." />
      </Head>
      <HeroSection>
        <HeroH1>Join us in our mission to ensure humanity safely navigates the transition to transformative AI.</HeroH1>
        <HeroCTAContainer>
          <CTALinkOrButton url="#open-roles-anchor" withChevron>See open roles</CTALinkOrButton>
        </HeroCTAContainer>
      </HeroSection>
      <CultureSection />
      <ValuesSection />
      <CareersSection />
    </div>
  );
};

export default CareersPage;
