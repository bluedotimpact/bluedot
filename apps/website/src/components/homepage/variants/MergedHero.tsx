import clsx from 'clsx';
import { H1 } from '@bluedot/ui';
import GraduateSection from '../../lander/components/GraduateSection';
import { Nav } from '../../Nav/Nav';

const MergedHero: React.FC<{ className?: string }> = ({ className }) => (
  <>
    <div className={clsx('relative w-full', className)}>
      <Nav />
      <div className="relative flex flex-col min-h-[653px] bd-md:max-[1023px]:min-h-[659px] min-[1024px]:max-[1279px]:min-h-[738px] min-[1280px]:max-[1439px]:min-h-[821px] min-[1440px]:min-h-[821px] w-full -scale-x-100">
        <img
          src="/images/homepage/hero.webp"
          alt=""
          className="absolute inset-0 size-full object-cover"
          {...{ fetchpriority: 'high' }}
        />

        {/* Nav spacer */}
        <div className="relative z-20 min-h-[60px] bd-md:max-[1023px]:min-h-[60px] lg:min-h-[76px] -scale-x-100" />

        {/* Content */}
        <div className="relative z-20 flex-1 flex flex-col justify-end px-5 py-12 bd-md:max-[1023px]:justify-center bd-md:max-[1023px]:px-8 bd-md:max-[1023px]:py-20 min-[1024px]:max-[1279px]:justify-center min-[1024px]:max-[1279px]:px-12 min-[1024px]:max-[1279px]:pt-32 min-[1024px]:max-[1279px]:pb-24 min-[1280px]:max-[1439px]:justify-start min-[1280px]:max-[1439px]:pt-40 min-[1280px]:max-[1439px]:pb-[120px] min-[1280px]:max-[1439px]:px-12 min-[1440px]:justify-center min-[1440px]:px-6 min-[1440px]:py-0 -scale-x-100">
          <div className="w-full max-w-[1488px] mx-auto min-[1440px]:px-6">
            <div className="w-full max-w-[280px] bd-md:max-[1023px]:max-w-[680px] min-[1024px]:max-[1279px]:max-w-[860px] min-[1280px]:max-[1439px]:max-w-[860px] min-[1440px]:max-w-[1000px] mx-auto flex flex-col justify-center items-center gap-7 text-center text-white">
              <H1
                className="w-full text-[34px] bd-md:max-[1023px]:text-[48px] min-[1024px]:max-[1279px]:text-[58px] min-[1280px]:max-[1439px]:text-[64px] min-[1440px]:text-[68px] leading-[110%] font-normal slide-up-fade-in tracking-[-1px] text-white"
              >
                The most consequential technology in human history is being built right now.
              </H1>
              <p
                className="text-size-sm bd-md:max-[1023px]:text-[20px] min-[1024px]:text-[20px] leading-[155%] font-normal w-full max-w-[280px] bd-md:max-[1023px]:max-w-[680px] min-[1024px]:max-[1279px]:max-w-[820px] min-[1280px]:max-[1439px]:max-w-[820px] min-[1440px]:max-w-[900px] mx-auto tracking-[-0.005em]"
                style={{
                  fontFeatureSettings: '"ss02" on',
                }}
              >
                Frontier AI is moving faster than the people working to make it go well. We train more of them than anyone. 7,000+ alumni at Anthropic, DeepMind, the UN, and the AI Security Institute.
              </p>
              <div className="flex flex-col bd-md:flex-row gap-3 bd-md:gap-5 items-center mt-2">
                <a
                  href="/courses/future-of-ai"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-bluedot-normal text-white text-size-sm bd-md:text-size-md font-medium hover:bg-bluedot-dark transition-colors duration-200"
                >
                  Start the 2-hour course
                  <span aria-hidden="true">→</span>
                </a>
                <a
                  href="/courses/agi-strategy"
                  className="inline-flex items-center gap-2 text-white/85 hover:text-white text-size-sm bd-md:text-size-md underline-offset-4 hover:underline px-3 py-3"
                >
                  Or apply to AGI Strategy
                  <span aria-hidden="true">→</span>
                </a>
              </div>
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

export default MergedHero;
