import clsx from 'clsx';
import { H1 } from '@bluedot/ui';
import GraduateSection from '../../lander/components/GraduateSection';
import { Nav } from '../../Nav/Nav';

const EditorialHero: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('relative w-full', className)}>
    <Nav />
    <div className="relative flex flex-col min-h-[680px] lg:min-h-[760px] w-full bg-[#0A0822] -scale-x-100">
      {/* Layered editorial gradient (deep navy + subtle warm bloom from the right) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 100% 30%, rgba(120, 90, 200, 0.35) 0%, transparent 60%), radial-gradient(ellipse 80% 80% at 0% 80%, rgba(64, 146, 214, 0.18) 0%, transparent 60%), linear-gradient(180deg, #0A0822 0%, #131635 100%)',
        }}
      />
      {/* Subtle noise */}
      <div
        className="absolute inset-0 mix-blend-soft-light opacity-25 pointer-events-none"
        style={{
          backgroundImage: 'url(/images/agi-strategy/noise.webp)',
          backgroundRepeat: 'repeat',
          backgroundSize: '464.64px 736.56px',
        }}
      />

      {/* Nav spacer */}
      <div className="relative z-20 min-h-[60px] lg:min-h-[76px] -scale-x-100" />

      <div className="relative z-20 flex-1 flex flex-col justify-center px-5 py-16 bd-md:px-8 lg:px-12 -scale-x-100">
        <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-8 lg:gap-10">
          <span className="text-size-xs font-medium tracking-[2px] uppercase text-white/55">
            BlueDot Impact
          </span>
          <H1 className="text-[36px] bd-md:text-[52px] lg:text-[68px] xl:text-[80px] leading-[1.05] font-normal tracking-[-1.5px] text-white max-w-[1100px]">
            The most consequential technology in human history is being built right now.
          </H1>
          <p className="text-size-md md:text-[20px] lg:text-[22px] leading-[1.55] text-white/80 max-w-[820px] tracking-[-0.005em]">
            Frontier AI is moving faster than the people working to make it go well. We train more of them than anyone. 7,000+ alumni at Anthropic, DeepMind, the UN, and the AI Security Institute.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 mt-4 sm:items-center">
            <a
              href="/courses/future-of-ai"
              className="inline-flex items-center gap-3 px-7 py-4 rounded-full bg-white text-bluedot-navy text-size-md font-medium hover:bg-white/90 transition-colors duration-200"
            >
              Start with the 2-hour course
              <span aria-hidden="true">→</span>
            </a>
            <a
              href="/courses/agi-strategy"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white text-size-sm md:text-size-md underline-offset-4 hover:underline px-3 py-3"
            >
              Or apply to a cohort course
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-20 -scale-x-100">
        <GraduateSection />
      </div>
    </div>
  </div>
);

export default EditorialHero;
