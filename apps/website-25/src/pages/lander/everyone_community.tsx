import LandingHero from './LandingHero';
import LandingPageBase from '../../components/lander/LandingPageBase';
import { getCtaUrl } from '../../components/lander/getCtaUrl';

const VARIANT = 'everyone_community';

const LandingPage = () => {
  const hero = (
    <LandingHero
      pretitle="Tomorrow belongs to"
      title="everyone."
      subtitle="Join a community creating an AI future that works for all"
      ctaUrl={getCtaUrl(VARIANT)}
    />
  );

  return (
    <LandingPageBase variant={VARIANT} hero={hero} />
  );
};

LandingPage.rawLayout = true;

export default LandingPage;
