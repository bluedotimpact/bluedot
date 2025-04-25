import { CTALinkOrButton } from '@bluedot/ui';
import clsx from 'clsx';
import { H1, P } from '../Text';

export type LandingHeroProps = React.PropsWithChildren<{
  className?: string,
  pretitle?: string,
  title: string,
  subtitle?: string,
  ctaUrl: string,
}>;

const LandingHero: React.FC<LandingHeroProps> = ({
  className,
  pretitle,
  title,
  subtitle,
  ctaUrl,
}) => {
  return (
    <div className={clsx('landing-hero bg-canvas flex flex-row justify-center items-center w-full px-spacing-x bg-[url("/images/lander/hero-bkg.png")] bg-cover bg-center overflow-hidden', className)}>
      <div className="landing-hero__content max-w-[865px] pt-32 pb-16">
        <H1 className="landing-hero__title text-center font-serif flex flex-col items-center">
          {pretitle && <span className="landing-hero__pretitle text-4xl sm:text-6xl font-normal">{pretitle}</span>}
          <span className="landing-hero__title-text text-7xl sm:text-9xl font-bold text-bluedot-dark">{title}</span>
        </H1>
        <P className={clsx('landing-hero__subtitle text-center mt-6 font-serif', pretitle ? 'text-xl' : ' text-4xl sm:text-6xl')}>
          {subtitle}
        </P>
        <div className="flex justify-center mt-8">
          <CTALinkOrButton url={ctaUrl} variant="primary">
            Sign up for free
          </CTALinkOrButton>
        </div>
      </div>
    </div>
  );
};

export default LandingHero;
