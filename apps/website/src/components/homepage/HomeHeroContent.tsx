import clsx from 'clsx';
import { H1 } from '@bluedot/ui';
import GraduateSection from '../lander/components/GraduateSection';
import { Nav } from '../Nav/Nav';

const HomeHeroContent: React.FC<{ className?: string }> = ({ className }) => (
  <>
    {/* Hero with integrated nav and alumni */}
    <div className={clsx('relative w-full', className)}>
      <Nav />
      {/* Main Hero Container */}
      <div className="relative flex flex-col min-h-[653px] bd-md:max-[1023px]:min-h-[659px] min-[1024px]:max-[1279px]:min-h-[738px] min-[1280px]:max-[1439px]:min-h-[821px] min-[1440px]:min-h-[821px] w-full -scale-x-100">
        <img
          src="/images/homepage/hero.webp"
          alt=""
          className="absolute inset-0 size-full object-cover"
          // Workaround for bug with camelcase `fetchPriority`: https://github.com/facebook/react/issues/25682
          {...{ fetchpriority: 'high' }}
        />

        {/* Nav spacer */}
        <div className="relative z-20 min-h-[60px] bd-md:max-[1023px]:min-h-[60px] lg:min-h-[76px] -scale-x-100" />

        {/* Content Container */}
        <div className="relative z-20 flex-1 flex flex-col justify-end px-5 py-12 bd-md:max-[1023px]:justify-center bd-md:max-[1023px]:px-8 bd-md:max-[1023px]:py-20 min-[1024px]:max-[1279px]:justify-center min-[1024px]:max-[1279px]:px-12 min-[1024px]:max-[1279px]:pt-32 min-[1024px]:max-[1279px]:pb-24 min-[1280px]:max-[1439px]:justify-start min-[1280px]:max-[1439px]:pt-40 min-[1280px]:max-[1439px]:pb-[120px] min-[1280px]:max-[1439px]:px-12 min-[1440px]:justify-center min-[1440px]:px-6 min-[1440px]:py-0 -scale-x-100">
          <div className="w-full max-w-[1488px] mx-auto min-[1440px]:px-6">
            {/* Text container with responsive dimensions */}
            <div className="w-full max-w-[280px] bd-md:max-[1023px]:max-w-[616px] bd-md:max-[1023px]:min-h-[348px] min-[1024px]:max-[1279px]:w-[768px] min-[1024px]:max-[1279px]:max-w-screen-md min-[1024px]:max-[1279px]:min-h-[347px] min-[1280px]:max-[1439px]:w-[768px] min-[1280px]:max-[1439px]:max-w-screen-md min-[1280px]:max-[1439px]:min-h-[374px] min-[1440px]:w-[900px] min-[1440px]:max-w-[900px] min-[1440px]:min-h-[374px] mx-auto flex flex-col justify-center items-center gap-8 text-center text-white">
              <H1
                // eslint-disable-next-line @bluedot/custom/no-arbitrary-text-size -- deferred design pick: bespoke 5-breakpoint homepage hero ramp (40 → 56 → 64 → 72 → 72) tied to viewport-specific max-w values; can't compose into the 2-step responsive token chain
                className="w-full text-[40px] bd-md:max-[1023px]:text-[56px] min-[1024px]:max-[1279px]:w-[682px] min-[1024px]:max-[1279px]:text-[64px] min-[1280px]:max-[1439px]:w-[682px] min-[1280px]:max-[1439px]:text-[72px] min-[1440px]:w-[682px] min-[1440px]:text-[72px] leading-[115%] font-normal slide-up-fade-in flex items-center tracking-[-1px] text-white"
              >
                The most consequential technology in human history is being built right now.
              </H1>
              <p
                // eslint-disable-next-line @bluedot/custom/no-arbitrary-text-size -- subtitle ramp pairs with the bespoke H1 ramp above
                className="w-full text-[24px] bd-md:max-[1023px]:text-[32px] min-[1024px]:max-[1279px]:text-[36px] min-[1280px]:max-[1439px]:text-[40px] min-[1440px]:text-[40px] leading-[125%] font-normal tracking-[-0.5px] text-white/90"
              >
                And not enough people work on making it go well.
              </p>
              <p
                className="text-size-sm bd-md:max-[1023px]:text-size-md min-[1024px]:text-size-md leading-[155%] font-normal w-full max-w-[280px] bd-md:max-[1023px]:max-w-[616px] min-[1024px]:max-[1279px]:max-w-screen-md min-[1280px]:max-[1439px]:max-w-screen-md min-[1440px]:max-w-[900px] mx-auto tracking-[-0.005em]"
                style={{
                  /* Tailwind doesn't support OpenType font-feature-settings for stylistic alternates */
                  fontFeatureSettings: '"ss02" on',
                }}
              >
                BlueDot accelerates smart, mission-driven people into impactful work. We run courses, provide career advising, make grants, organise events all over the world, and support entrepreneurs to found new companies.
              </p>
              <a
                href="/courses/future-of-ai"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-bluedot-normal text-white text-size-sm bd-md:text-size-md font-medium hover:bg-bluedot-dark transition-colors duration-200 mt-2"
              >
                Learn where AI is headed
                <span aria-hidden="true">→</span>
              </a>
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
