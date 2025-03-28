import LandingHero from './LandingHero';
import LandingPageBase from '../../components/lander/LandingPageBase';
import { getCtaUrl } from '../../components/lander/getCtaUrl';

const VARIANT = 'jobs_optional_save_time';

const LandingPage = () => {
  const hero = (
    <LandingHero
      title="Let's make jobs optional"
      subtitle="Learn how to save 10 hours a week using AI tools"
      ctaUrl={getCtaUrl(VARIANT)}
    />
  );

  return (
    <LandingPageBase variant={VARIANT} hero={hero} />
  );
};

LandingPage.rawLayout = true;

export default LandingPage;
