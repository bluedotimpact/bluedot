import {
  HeroH1,
  HeroH2,
  HeroSection,
  HeroCTAContainer,
  CTALinkOrButton,
} from '@bluedot/ui';
import {
  FaStar,
  FaStopwatch,
  FaAward,
} from 'react-icons/fa6';
import GraduateSection from '../../components/homepage/GraduateSection';
import Container from '../../components/lander/Container';
import LandingPageBase from '../../components/lander/LandingPageBase';

const VARIANT = 'classic';

const LandingPage: React.FC = () => {
  const queryParams = new URLSearchParams(window.location.search);
  queryParams.append('prefill_Variant', VARIANT);
  const ctaUrl = `https://web.miniextensions.com/aGd0mXnpcN1gfqlnYNZc?${queryParams.toString()}`;

  const hero = (
    <>
      <HeroSection className="-mt-20 text-white bg-[url('/images/logo/logo_hero_background.svg')] bg-cover">
        <HeroH1 className="font-serif text-5xl sm:text-7xl font-normal">Future-proof your career</HeroH1>
        <HeroH2 className="text-size-md sm:text-size-lg font-light max-w-2xl mx-auto mt-10">No jargon, no coding, no pre-requisites – just bring your curiosity for how AI will reshape your world.</HeroH2>
        <HeroCTAContainer>
          <CTALinkOrButton url={ctaUrl}>Start learning for free</CTALinkOrButton>
        </HeroCTAContainer>
        <div className="flex flex-wrap justify-center gap-6 sm:gap-20 mt-10 uppercase font-bold">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
            <FaStar className="text-2xl" />
            <span>4.7/5 rating</span>
          </div>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
            <FaStopwatch className="text-2xl" />
            <span>2 hours</span>
          </div>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
            <FaAward className="text-2xl" />
            <span>Get certified</span>
          </div>
        </div>
      </HeroSection>
      <Container>
        <GraduateSection />
      </Container>
    </>
  );

  return (
    <LandingPageBase variant="classic" hero={hero} />
  );
};

export default LandingPage;
