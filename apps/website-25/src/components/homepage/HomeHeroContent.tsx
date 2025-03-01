import {
  HeroH1,
  HeroH2,
} from '@bluedot/ui';
import Rive, { Fit, Layout } from '@rive-app/react-canvas';
import clsx from 'clsx';

const HomeHeroContent: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('pb-5', className)}>
    <div className="hero-section__animation-container w-[350px] max-w-[80vw] aspect-4/3 mx-auto">
      <Rive
        src="/animations/herobluedot_hero.riv"
        layout={new Layout({ fit: Fit.Fill })}
      />
    </div>
    <HeroH1 className="slide-up-fade-in">
      The expertise you need to shape safe AI
    </HeroH1>
    <HeroH2 className="slide-up-fade-in" style={{ animationDelay: '100ms' }}>
      Learn alongside thousands of professionals through comprehensive courses designed with leading AI safety experts.
    </HeroH2>
  </div>
);

export default HomeHeroContent;
