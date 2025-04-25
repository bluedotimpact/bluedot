import LandingHero from '../../components/lander/LandingHero';
import LandingPageBase from '../../components/lander/LandingPageBase';
import { getCtaUrl } from '../../components/lander/getCtaUrl';

const VARIANT = 'jobs_optional_learn_skills';

const LandingPage = () => {
  const hero = (
    <LandingHero
      pretitle="Let's make"
      title="jobs optional"
      subtitle="Learn the skills to navigate the AI transition"
      ctaUrl={getCtaUrl(VARIANT)}
    />
  );

  return (
    <LandingPageBase variant={VARIANT} hero={hero} />
  );
};

LandingPage.rawLayout = true;

export default LandingPage;
