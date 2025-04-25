import {
  HeroH1,
  HeroH2,
} from '@bluedot/ui';
import Rive, { Fit, Layout } from '@rive-app/react-canvas';
import clsx from 'clsx';

const HomeHeroContent: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('home-hero-content pb-5 bg-bluedot-darker', className)}>
    <div className="home-hero-content__animation-container w-[350px] max-w-[80vw] aspect-4/3 mx-auto">
      <Rive
        src="/animations/herobluedot_hero.riv"
        layout={new Layout({ fit: Fit.Cover })}
      />
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
