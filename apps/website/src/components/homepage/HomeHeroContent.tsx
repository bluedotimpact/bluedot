import clsx from 'clsx';
import { Button, HeroH1 } from '@bluedot/ui';
import GraduateSection from '../lander/components/GraduateSection';
import { Nav } from '../Nav/Nav';

const HomeHeroContent: React.FC<{ className?: string }> = ({ className }) => (
  <>
    {/* Hero with integrated nav and alumni */}
    <div className={clsx('relative w-full', className)}>
      <Nav />
      {/* Main Hero Container */}
      <div className="relative flex flex-col min-h-[653px] bd-md:min-h-[659px] lg:min-h-[738px] xl:min-h-[821px] w-full -scale-x-100">
        <img
          src="/images/homepage/hero.webp"
          alt=""
          className="absolute inset-0 size-full object-cover"
          // Workaround for bug with camelcase `fetchPriority`: https://github.com/facebook/react/issues/25682
          {...{ fetchpriority: 'high' }}
        />

        {/* Nav spacer */}
        <div className="relative z-20 min-h-[60px] lg:min-h-[76px] -scale-x-100" />

        {/* Content Container */}
        <div data-on-dark className="relative z-20 flex-1 flex flex-col justify-end px-5 py-12 bd-md:justify-center bd-md:px-8 bd-md:py-20 lg:px-12 lg:pt-32 lg:pb-24 xl:justify-start xl:pt-40 xl:pb-[120px] min-[1440px]:justify-center min-[1440px]:px-6 min-[1440px]:py-0 -scale-x-100">
          <div className="w-full max-w-[1488px] mx-auto min-[1440px]:px-6">
            {/* Text container with responsive dimensions */}
            <div className="w-full max-w-[280px] bd-md:max-w-[616px] bd-md:min-h-[348px] lg:w-[768px] lg:max-w-screen-md lg:min-h-[347px] xl:min-h-[374px] min-[1440px]:w-[900px] min-[1440px]:max-w-[900px] mx-auto flex flex-col justify-center items-center gap-8 text-center text-on-dark">
              <HeroH1
                className="w-full text-balance slide-up-fade-in"
                /* Deliberately Inter, not the InterDisplay that `.bluedot-h1` sets: the design
                   calls for Inter's wider letterforms here. Inline style because the unlayered
                   `.bluedot-h1` rule in globals.css outranks any Tailwind font utility. */
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Humanity is building something smarter and more powerful than itself.
              </HeroH1>
              <p className="text-size-lg xl:text-size-xl leading-snug font-normal text-balance slide-up-fade-in">
                Let&apos;s make sure it goes well for all of us.
              </p>
              <p
                className="text-size-sm bd-md:text-size-md leading-relaxed font-normal w-full max-w-[280px] bd-md:max-w-[616px] lg:max-w-screen-md min-[1440px]:max-w-[900px] mx-auto"
                style={{
                  /* Tailwind doesn't support OpenType font-feature-settings for stylistic alternates */
                  fontFeatureSettings: '"ss02" on',
                }}
              >
                AI could cure diseases and end poverty. It could also cause catastrophes we can&apos;t recover from. Only a few thousand people are working to make it go well. BlueDot helps you join them.
              </p>
              <Button url="/courses/future-of-ai" size="large">
                Start the free Future of AI course
              </Button>
            </div>
          </div>
        </div>

        {/* Alumni Section - at bottom of hero */}
        <div className="relative z-20 -scale-x-100">
          <GraduateSection />
        </div>
      </div>
    </div>
  </>
);

export default HomeHeroContent;
