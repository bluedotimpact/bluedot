import clsx from 'clsx';
import { H1 } from '@bluedot/ui';
import GraduateSection from '../../lander/components/GraduateSection';
import { Nav } from '../../Nav/Nav';
import { COURSE_COLORS } from '../../../lib/courseColors';

const FOAI = COURSE_COLORS['future-of-ai'];
const AGISC = COURSE_COLORS['agi-strategy'];

const DoorCard = ({
  href,
  eyebrow,
  title,
  description,
  cta,
  gradient,
  accent,
  iconSrc,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  gradient: string;
  accent: string;
  iconSrc: string;
}) => (
  <a
    href={href}
    className="relative rounded-xl border border-white/15 overflow-hidden group cursor-pointer block flex-1 backdrop-blur-md"
  >
    <div className="absolute inset-0 pointer-events-none" style={{ background: gradient }} />
    <div
      className="absolute inset-0 mix-blend-soft-light opacity-30 pointer-events-none"
      style={{
        backgroundImage: 'url(/images/agi-strategy/noise.webp)',
        backgroundRepeat: 'repeat',
        backgroundSize: '464.64px 736.56px',
      }}
    />
    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    <div className="relative z-10 flex flex-col gap-4 p-6 md:p-7 lg:p-8 min-h-[240px] md:min-h-[280px]">
      <div className="flex items-center justify-between gap-3">
        <span
          className="text-size-xxs font-medium tracking-[1.5px] uppercase"
          style={{ color: accent }}
        >
          {eyebrow}
        </span>
        <div className="size-10 md:size-12 opacity-90">
          <img src={iconSrc} alt="" className="block size-full" />
        </div>
      </div>
      <div className="flex flex-col gap-3 mt-auto">
        <h3 className="text-[22px] md:text-[26px] lg:text-[28px] font-medium tracking-[-0.3px] text-white leading-[1.2]">
          {title}
        </h3>
        <p className="text-size-sm leading-[1.55] text-white/85 max-w-[420px]">
          {description}
        </p>
        <span className="inline-flex items-center gap-2 text-white text-size-sm font-medium mt-2 group-hover:translate-x-1 transition-transform duration-200">
          {cta}
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </div>
  </a>
);

const DualDoorHero: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('relative w-full', className)}>
    <Nav />
    <div className="relative flex flex-col min-h-[760px] bd-md:max-[1023px]:min-h-[820px] min-[1024px]:min-h-[820px] w-full -scale-x-100">
      <img
        src="/images/homepage/hero.webp"
        alt=""
        className="absolute inset-0 size-full object-cover"
        {...{ fetchpriority: 'high' }}
      />
      {/* Darken overlay so the two cards read clearly on top */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      {/* Nav spacer */}
      <div className="relative z-20 min-h-[60px] lg:min-h-[76px] -scale-x-100" />

      {/* Content */}
      <div className="relative z-20 flex-1 flex flex-col justify-center px-5 py-12 bd-md:px-8 lg:px-12 -scale-x-100">
        <div className="w-full max-w-[1200px] mx-auto flex flex-col items-center text-center gap-10 lg:gap-12">
          <H1 className="text-[36px] bd-md:text-[48px] lg:text-[60px] xl:text-[68px] leading-[1.1] font-normal tracking-[-1px] text-white max-w-[900px]">
            We help you have a positive impact on the trajectory of AI
          </H1>
          <p className="text-size-md md:text-[20px] leading-[1.55] text-white/85 max-w-[700px]">
            Two ways in, depending on where you're starting.
          </p>

          {/* Two equal door cards */}
          <div className="w-full max-w-[1100px] flex flex-col md:flex-row gap-5 md:gap-6 lg:gap-8 mt-2">
            <DoorCard
              href="/courses/future-of-ai"
              eyebrow="Just exploring"
              title="The Future of AI"
              description="A free, 2-hour intro. What frontier AI can do, where it's headed, and how to help. Self-paced, no application."
              cta="Start the course"
              gradient={FOAI.gradient}
              accent={FOAI.accent}
              iconSrc="/images/courses/future-of-ai-icon.svg"
            />
            <DoorCard
              href="/courses/agi-strategy"
              eyebrow="Ready to commit"
              title="AGI Strategy"
              description="A 25-hour cohort course over 5 weeks with a facilitator and 8 peers. The entry point into our cohort programmes."
              cta="Apply for the next cohort"
              gradient={AGISC.gradient}
              accent={AGISC.accent}
              iconSrc="/images/courses/agi-strategy-icon.svg"
            />
          </div>
        </div>
      </div>

      {/* Alumni strip at bottom */}
      <div className="relative z-20 -scale-x-100">
        <GraduateSection />
      </div>
    </div>
  </div>
);

export default DualDoorHero;
