import {
  HeroH1,
  HeroH2,
} from '@bluedot/ui';
import clsx from 'clsx';

const HomeHeroContent: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('home-hero-content pb-5 bg-bluedot-darker', className)}>
    <div className="home-hero-content__logo-container flex flex-col items-center gap-7 mb-8 slide-up-fade-in">
      <img className="home-hero-content__logo-icon w-20" src="/images/logo/BlueDot_Impact_Icon_White.svg" alt="BlueDot Impact" />
    </div>
    <HeroH1 className="home-hero-content__heading slide-up-fade-in">
      The expertise you need to shape safe AI
    </HeroH1>
    <HeroH2 className="home-hero-content__subheading slide-up-fade-in" style={{ animationDelay: '100ms' }}>
      Learn alongside thousands of professionals through comprehensive courses designed with leading AI safety experts.
    </HeroH2>
  </div>
);

export default HomeHeroContent;
