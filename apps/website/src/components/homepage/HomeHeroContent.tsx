import clsx from 'clsx';
import { H1 } from '@bluedot/ui/src/Text';
import GraduateSection from '../lander/components/GraduateSection';

const HomeHeroContent: React.FC<{ className?: string }> = ({ className }) => (
  <>
    {/* Hero with integrated nav and alumni */}
    <div className={clsx('relative w-full', className)}>
      {/* Main Hero Container */}
      <div className="relative flex flex-col min-h-[653px] min-[680px]:max-[1023px]:min-h-[659px] min-[1024px]:max-[1279px]:min-h-[738px] min-[1280px]:max-[1439px]:min-h-[821px] min-[1440px]:min-h-[821px] w-full -scale-x-100">
        <img
          src="/images/homepage/hero.webp"
          alt=""
          className="absolute inset-0 size-full object-cover"
          fetchPriority="high"
        />

        {/* Nav spacer */}
        <div className="relative z-20 min-h-[60px] min-[680px]:max-[1023px]:min-h-[60px] min-[1024px]:min-h-[76px] -scale-x-100" />

        {/* Content Container */}
        <div className="relative z-20 flex-1 flex flex-col justify-end px-5 py-12 min-[680px]:max-[1023px]:justify-center min-[680px]:max-[1023px]:px-8 min-[680px]:max-[1023px]:py-20 min-[1024px]:max-[1279px]:justify-center min-[1024px]:max-[1279px]:px-12 min-[1024px]:max-[1279px]:pt-32 min-[1024px]:max-[1279px]:pb-24 min-[1280px]:max-[1439px]:justify-start min-[1280px]:max-[1439px]:pt-40 min-[1280px]:max-[1439px]:pb-[120px] min-[1280px]:max-[1439px]:px-12 min-[1440px]:justify-center min-[1440px]:px-6 min-[1440px]:py-0 -scale-x-100">
          <div className="w-full max-w-[1488px] mx-auto min-[1440px]:px-6">
            {/* Text container with responsive dimensions */}
            <div className="w-full max-w-[280px] min-[680px]:max-[1023px]:max-w-[616px] min-[680px]:max-[1023px]:min-h-[348px] min-[1024px]:max-[1279px]:w-[768px] min-[1024px]:max-[1279px]:max-w-screen-md min-[1024px]:max-[1279px]:min-h-[347px] min-[1280px]:max-[1439px]:w-[768px] min-[1280px]:max-[1439px]:max-w-screen-md min-[1280px]:max-[1439px]:min-h-[374px] min-[1440px]:w-[900px] min-[1440px]:max-w-[900px] min-[1440px]:min-h-[374px] mx-auto flex flex-col justify-center items-center gap-8 text-center text-white">
              <H1
                className="w-full text-[40px] min-[680px]:max-[1023px]:text-[56px] min-[1024px]:max-[1279px]:w-[682px] min-[1024px]:max-[1279px]:text-[64px] min-[1280px]:max-[1439px]:w-[682px] min-[1280px]:max-[1439px]:text-[72px] min-[1440px]:w-[682px] min-[1440px]:text-[72px] leading-[115%] font-normal slide-up-fade-in flex items-center tracking-[-1px] text-white"
              >
                We help you have a positive impact on the trajectory of AI
              </H1>
              <p
                className="text-size-sm min-[680px]:max-[1023px]:text-[20px] min-[1024px]:text-[20px] leading-[155%] font-normal w-full max-w-[280px] min-[680px]:max-[1023px]:max-w-[616px] min-[1024px]:max-[1279px]:max-w-screen-md min-[1280px]:max-[1439px]:max-w-screen-md min-[1440px]:max-w-[900px] mx-auto tracking-[-0.005em]"
                style={{
                  /* Tailwind doesn't support OpenType font-feature-settings for stylistic alternates */
                  fontFeatureSettings: '"ss02" on',
                }}
              >
                BlueDot is the leading talent accelerator for beneficial AI and societal resilience. We run courses, help people land jobs, organise events all over the world, and accelerate entrepreneurs to start new companies
              </p>
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
