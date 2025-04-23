import {
  FaStar,
  FaStopwatch,
  FaAward,
} from 'react-icons/fa6';
import LandingPageBase from '../../components/lander/LandingPageBase';
import ClassicHero from '../../components/lander/ClassicHero';

const VARIANT = 'classic';

const LandingPage = () => {
  const hero = (
    <ClassicHero>
      <ClassicHero.Title>Future-proof your career</ClassicHero.Title>
      <ClassicHero.Subtitle>
        No jargon, no coding, no pre-requisites – just bring your curiosity for how AI will reshape your world.
      </ClassicHero.Subtitle>
      <ClassicHero.CTA variant={VARIANT}>Start learning for free</ClassicHero.CTA>
      <ClassicHero.Features>
        <ClassicHero.Feature icon={FaStar}>4.7/5 rating</ClassicHero.Feature>
        <ClassicHero.Feature icon={FaStopwatch}>2 hours</ClassicHero.Feature>
        <ClassicHero.Feature icon={FaAward}>Get certified</ClassicHero.Feature>
      </ClassicHero.Features>
    </ClassicHero>
  );

  return (
    <LandingPageBase variant={VARIANT} hero={hero} />
  );
};

LandingPage.rawLayout = true;

export default LandingPage;
