import clsx from 'clsx';
import {
  H2, H3, P, Section,
} from '@bluedot/ui';
import { COURSE_COLORS } from '../../../lib/courseColors';

const FOAI = COURSE_COLORS['future-of-ai'];

type FoaiCalloutProps = {
  /** When true, the callout reads as the *primary* CTA (used in V5). */
  primary?: boolean;
  /** Optional eyebrow to override the default. */
  eyebrow?: string;
  className?: string;
};

const FoaiCallout = ({ primary = false, eyebrow, className }: FoaiCalloutProps) => {
  return (
    <Section
      className={clsx(
        'py-12 md:py-16 lg:py-20 xl:py-24 px-5 bd-md:px-8 lg:px-12 xl:px-16 2xl:px-20',
        className,
      )}
    >
      <div className="mx-auto max-w-screen-xl">
        <a
          href="/courses/future-of-ai"
          className="relative rounded-xl border border-bluedot-navy/10 overflow-hidden group cursor-pointer block"
        >
          {/* Background gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: FOAI.gradient }}
          />
          {/* Noise texture */}
          <div
            className="absolute inset-0 mix-blend-soft-light opacity-30 pointer-events-none"
            style={{
              backgroundImage: 'url(/images/agi-strategy/noise.webp)',
              backgroundRepeat: 'repeat',
              backgroundSize: '464.64px 736.56px',
            }}
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 p-8 md:p-12 lg:p-16 xl:p-20 min-h-[320px] lg:min-h-[420px] items-center">
            <div className="flex flex-col gap-6 max-w-[600px]">
              <P
                className="text-size-xs font-medium tracking-[1.5px] uppercase"
                style={{ color: FOAI.accent }}
              >
                {eyebrow ?? 'New to AI safety? Start here'}
              </P>
              {primary ? (
                <H2 className="text-[28px] md:text-[36px] lg:text-[44px] xl:text-[52px] leading-[1.1] tracking-[-0.5px] text-white font-medium">
                  Start with The Future of AI
                </H2>
              ) : (
                <H3 className="text-[24px] md:text-[28px] lg:text-[32px] xl:text-[36px] leading-[1.2] tracking-[-0.5px] text-white font-medium">
                  Get oriented in two hours
                </H3>
              )}
              <P className="text-size-sm md:text-size-md leading-[1.55] text-white/85 max-w-[520px]">
                Our free intro to what frontier AI can do, where it's headed, and how you can help. Self-paced, no application, finish in an evening.
              </P>
              <div className="flex flex-wrap gap-2 mt-2">
                {['2 hours', 'Free', 'Self-paced', 'No application'].map((tag) => (
                  <span
                    key={tag}
                    className="px-[10px] py-[5px] text-size-xxs font-medium leading-[1.4] tracking-[0.5px] uppercase rounded bg-white/5 border border-white/30 backdrop-blur-[10px] text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-4">
                <span className="inline-flex items-center gap-2 text-white text-size-md font-medium group-hover:translate-x-1 transition-transform duration-200">
                  Start the course
                  <span aria-hidden="true">→</span>
                </span>
              </div>
            </div>

            {/* Right-side icon plate */}
            <div className="hidden lg:flex items-center justify-center">
              <div
                className="size-[200px] xl:size-[260px] rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}
              >
                <img
                  src="/images/courses/future-of-ai-icon.svg"
                  alt=""
                  className="size-[100px] xl:size-[140px] opacity-90"
                />
              </div>
            </div>
          </div>
        </a>
      </div>
    </Section>
  );
};

export default FoaiCallout;
