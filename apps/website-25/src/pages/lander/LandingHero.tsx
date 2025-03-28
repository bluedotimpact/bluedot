import { CTALinkOrButton } from '@bluedot/ui';
import clsx from 'clsx';

export type LandingHeroProps = React.PropsWithChildren<{
  className?: string,
  pretitle?: string,
  title: string,
  subtitle?: string,
  ctaUrl: string,
}>;

<<<<<<< Updated upstream
const LandingHero: React.FC<LandingHeroProps> = ({
  className,
  pretitle,
  title,
  subtitle,
  ctaUrl,
}) => {
  return (
    <div className={clsx('landing-hero bg-canvas flex flex-row justify-center items-center w-full px-spacing-x', className)}>
      {/* Top margin is nav height (82px) */}
      <div className="landing-hero__content max-w-[865px] mt-[82px] py-16">
        <h1 className="landing-hero__title text-center font-serif flex flex-col items-center">
          {pretitle && <span className="landing-hero__pretitle text-6xl font-normal">{pretitle}</span>}
          <span className="landing-hero__title-text text-9xl font-bold text-bluedot-darker">{title}</span>
        </h1>
        <p className="landing-hero__subtitle text-center text-size-l mt-4 font-serif">
          {subtitle}
        </p>
        <div className="flex justify-center mt-8">
          <CTALinkOrButton url={ctaUrl} variant="primary">
            Sign up for free
          </CTALinkOrButton>
=======
export const LandingHero: React.FC<LandingHeroProps> = ({
    className,
    pretitle,
    title,
    subtitle,
    ctaUrl
  }) => {
    return (
      <div className={clsx('landing-hero bg-canvas flex flex-row justify-center items-center w-full px-spacing-x bg-[url("/images/lander/hero-bkg.png")] bg-cover bg-center', className)}>
        {/* Top margin is nav height (82px) */}
        <div className="landing-hero__content max-w-[865px] mt-[82px] py-16">
          <h1 className="landing-hero__title text-center font-serif flex flex-col items-center">
            {pretitle && <span className="landing-hero__pretitle text-6xl font-normal">{pretitle}</span>}
            <span className="landing-hero__title-text text-9xl font-bold text-bluedot-darker">{title}</span>
          </h1>
          <p className="landing-hero__subtitle text-center text-lg mt-6 font-serif">
            {subtitle}
          </p>
          <div className="flex justify-center mt-8">
            <CTALinkOrButton url={ctaUrl} variant="primary">
              Sign up for free
            </CTALinkOrButton>
          </div>
>>>>>>> Stashed changes
        </div>
      </div>
    </div>
  );
};

export default LandingHero;
