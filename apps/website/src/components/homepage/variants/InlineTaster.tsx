import {
  H2, H3, P, Section,
} from '@bluedot/ui';
import { COURSE_COLORS } from '../../../lib/courseColors';

const FOAI = COURSE_COLORS['future-of-ai'];

type Capability = {
  year: string;
  label: string;
  headline: string;
  body: string;
  /** Decorative accent colour intensity for the year chip. */
  accentOpacity: number;
};

const CAPABILITIES: Capability[] = [
  {
    year: '2020',
    label: 'GPT-3',
    headline: 'AI could write a paragraph.',
    body: 'Coherent prose, occasional hallucinations, no real reasoning. Felt like an upgraded autocomplete.',
    accentOpacity: 0.25,
  },
  {
    year: '2022',
    label: 'GPT-3.5 + ChatGPT',
    headline: 'AI could explain its answers.',
    body: 'A model that talked back, answered follow-ups, and could draft a passable cover letter. 100M users in two months.',
    accentOpacity: 0.45,
  },
  {
    year: '2024',
    label: 'GPT-4o, Claude 3.5, Sora',
    headline: 'AI could see, hear, and generate video.',
    body: 'Multimodal models that understood images and produced minute-long video clips good enough to fool casual viewers.',
    accentOpacity: 0.7,
  },
  {
    year: '2026',
    label: 'Frontier reasoning + agents',
    headline: 'AI could plan, browse, and ship work end-to-end.',
    body: 'Long-horizon tasks: agents that book travel, ship pull requests, and run multi-day research. PhD-level reasoning across most domains.',
    accentOpacity: 1,
  },
];

const CapabilityCard = ({ cap }: { cap: Capability }) => (
  <div className="relative rounded-xl border border-bluedot-navy/10 overflow-hidden bg-white flex flex-col h-full">
    {/* Top decorative band, intensity scales with year */}
    <div
      className="h-2 w-full"
      style={{ background: FOAI.full, opacity: cap.accentOpacity }}
    />
    <div className="flex flex-col gap-4 p-6 md:p-7 flex-1">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-[28px] md:text-[32px] font-medium tracking-[-0.5px] text-bluedot-navy">
          {cap.year}
        </span>
        <span className="text-size-xxs font-medium uppercase tracking-[1.5px] text-bluedot-navy/60">
          {cap.label}
        </span>
      </div>
      <H3 className="text-size-md md:text-[20px] font-medium leading-[1.3] tracking-[-0.2px] text-bluedot-navy">
        {cap.headline}
      </H3>
      <P className="text-size-sm leading-[1.55] text-bluedot-navy/70">
        {cap.body}
      </P>
    </div>
  </div>
);

const InlineTaster = () => (
  <Section className="py-12 md:py-16 lg:py-24 px-5 bd-md:px-8 lg:px-12 xl:px-16 2xl:px-20 bg-[#FAFAF7]">
    <div className="mx-auto max-w-screen-xl flex flex-col gap-10 lg:gap-14">
      <div className="flex flex-col items-center gap-5 text-center max-w-3xl mx-auto">
        <P
          className="text-size-xs font-medium tracking-[1.5px] uppercase"
          style={{ color: FOAI.full }}
        >
          A taste of the course
        </P>
        <H2 className="text-[28px] md:text-[36px] lg:text-[44px] xl:text-[52px] leading-[1.1] tracking-[-1px] font-medium text-bluedot-navy">
          See what AI can do, right now.
        </H2>
        <P className="text-size-md leading-[1.6] text-bluedot-navy/75 max-w-2xl">
          Six years ago AI could barely write a sentence. Today it can run multi-day projects without supervision. The next two years will look like nothing we've seen.
        </P>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
        {CAPABILITIES.map((cap) => (
          <CapabilityCard key={cap.year} cap={cap} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 mt-2">
        <a
          href="/courses/future-of-ai"
          className="inline-flex items-center gap-3 px-7 py-4 rounded-full bg-bluedot-navy text-white text-size-md font-medium hover:bg-bluedot-dark transition-colors duration-200"
        >
          Continue the 2-hour course
          <span aria-hidden="true">→</span>
        </a>
        <P className="text-size-xs text-bluedot-navy/55">
          Free, self-paced, no application.
        </P>
      </div>
    </div>
  </Section>
);

export default InlineTaster;
