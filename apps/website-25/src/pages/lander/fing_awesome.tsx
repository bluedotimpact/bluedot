import LandingHero from '../../components/lander/LandingHero';
import LandingPageBase from '../../components/lander/LandingPageBase';
import { getCtaUrl } from '../../components/lander/getCtaUrl';

const VARIANT = 'fing_awesome';

const LandingPage = () => {
  const hero = (
    <LandingHero
      pretitle="The future is going to be"
      title="f_cking awesome*"
      subtitle="*Terms and conditions apply"
      ctaUrl={getCtaUrl(VARIANT)}
    />
  );

  return (
    <LandingPageBase variant={VARIANT} hero={hero} />
  );
};

LandingPage.rawLayout = true;

export default LandingPage;
