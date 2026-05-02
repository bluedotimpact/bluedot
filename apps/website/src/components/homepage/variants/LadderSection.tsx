import clsx from 'clsx';
import {
  H2, H3, P, Section, ProgressDots,
} from '@bluedot/ui';
import { trpc } from '../../../utils/trpc';
import { COURSE_COLORS, type CourseColorSlug } from '../../../lib/courseColors';
import { GRANT_PROGRAMS } from '../../grants/grantPrograms';

const FOAI = COURSE_COLORS['future-of-ai'];

const COHORT_SLUGS: CourseColorSlug[] = [
  'agi-strategy',
  'technical-ai-safety',
  'ai-governance',
  'biosecurity',
];

const COHORT_ICONS: Record<string, string> = {
  'agi-strategy': '/images/courses/agi-strategy-icon.svg',
  'technical-ai-safety': '/images/courses/technical-ai-safety-icon.svg',
  'ai-governance': '/images/courses/ai-governance-icon.svg',
  biosecurity: '/images/courses/biosecurity-icon.svg',
};

type Rung = {
  number: number;
  label: string;
  duration: string;
  title: string;
  description: string;
};

const RUNGS: Rung[] = [
  {
    number: 1,
    label: 'Learn',
    duration: '2 hours',
    title: 'Get oriented',
    description: 'Future of AI: a free intro to what frontier AI can do, where it\'s headed, and how to help. Self-paced.',
  },
  {
    number: 2,
    label: 'Engage',
    duration: '25 hours, cohort-based',
    title: 'Go deep on a path',
    description: 'AGI Strategy is the entry point. Specialise in technical safety, governance, or biosecurity once you have the strategic picture.',
  },
  {
    number: 3,
    label: 'Lead',
    duration: 'Months',
    title: 'Build something',
    description: 'Funding, sprints, and an incubator for people building the next thing in AI safety.',
  },
];

const RungHeader = ({ rung }: { rung: Rung }) => (
  <div className="flex flex-col gap-3 max-w-[700px]">
    <div className="flex items-center gap-4">
      <div className="size-10 rounded-full bg-bluedot-navy text-white font-medium flex items-center justify-center text-size-md">
        {rung.number}
      </div>
      <div className="flex items-baseline gap-3 flex-wrap">
        <H3 className="text-size-lg md:text-[24px] font-medium tracking-[-0.3px] text-bluedot-navy">
          {rung.label}
        </H3>
        <P className="text-size-xs uppercase tracking-[1.5px] text-bluedot-navy/60">
          {rung.duration}
        </P>
      </div>
    </div>
    <H3 className="text-[24px] md:text-[32px] lg:text-[36px] leading-[1.2] tracking-[-0.5px] font-medium text-bluedot-navy">
      {rung.title}
    </H3>
    <P className="text-size-sm md:text-size-md leading-[1.6] text-bluedot-navy/75">
      {rung.description}
    </P>
  </div>
);

const FoaiRungCard = () => (
  <a
    href="/courses/future-of-ai"
    className="relative rounded-xl border border-bluedot-navy/10 overflow-hidden group cursor-pointer block"
  >
    <div className="absolute inset-0 pointer-events-none" style={{ background: FOAI.gradient }} />
    <div
      className="absolute inset-0 mix-blend-soft-light opacity-30 pointer-events-none"
      style={{
        backgroundImage: 'url(/images/agi-strategy/noise.webp)',
        backgroundRepeat: 'repeat',
        backgroundSize: '464.64px 736.56px',
      }}
    />
    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-12 p-8 md:p-10 lg:p-12 min-h-[260px] items-start lg:items-center">
      <div className="size-16 lg:size-20">
        <img src="/images/courses/future-of-ai-icon.svg" alt="" className="block size-full" />
      </div>
      <div className="flex flex-col gap-3 flex-1">
        <H3 className="text-[22px] md:text-[26px] lg:text-[30px] font-medium tracking-[-0.3px] text-white leading-[1.25]">
          The Future of AI
        </H3>
        <P className="text-size-sm md:text-size-md leading-[1.55] text-white/85 max-w-[520px]">
          A free, self-paced 2-hour course. Finish in an evening with a clearer picture of frontier AI and how to help.
        </P>
        <div className="flex flex-wrap gap-2 mt-2">
          {['2 hours', 'Free', 'No application'].map((tag) => (
            <span
              key={tag}
              className="px-[10px] py-[5px] text-size-xxs font-medium leading-[1.4] tracking-[0.5px] uppercase rounded bg-white/5 border border-white/30 backdrop-blur-[10px] text-white"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 text-white text-size-md font-medium group-hover:translate-x-1 transition-transform duration-200">
        Start the course
        <span aria-hidden="true">→</span>
      </div>
    </div>
  </a>
);

type CohortCard = {
  slug: CourseColorSlug;
  title: string;
  shortDescription: string;
  durationHours?: number | null;
};

const CohortCard = ({ course, featured = false }: { course: CohortCard; featured?: boolean }) => {
  const colors = COURSE_COLORS[course.slug];
  return (
    <a
      href={`/courses/${course.slug}`}
      className={clsx(
        'relative rounded-xl border border-bluedot-navy/10 overflow-hidden group cursor-pointer block h-full',
      )}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: colors.gradient }} />
      <div
        className="absolute inset-0 mix-blend-soft-light opacity-30 pointer-events-none"
        style={{
          backgroundImage: 'url(/images/agi-strategy/noise.webp)',
          backgroundRepeat: 'repeat',
          backgroundSize: '464.64px 736.56px',
        }}
      />
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
      <div className={clsx(
        'relative z-10 flex flex-col h-full p-6 md:p-8',
        featured ? 'min-h-[280px]' : 'min-h-[220px]',
      )}
      >
        <div className="flex-grow">
          <div className={clsx(featured ? 'size-16 md:size-20' : 'size-12 md:size-14')}>
            <img src={COHORT_ICONS[course.slug]} alt="" className="block size-full" />
          </div>
        </div>
        <div className="flex flex-col gap-3 mt-6">
          <H3 className={clsx(
            'font-[450] leading-[1.3] tracking-[-0.3px] text-white',
            featured ? 'text-[22px] md:text-size-lg' : 'text-size-md md:text-[20px]',
          )}
          >
            {course.title}
            <span className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
          </H3>
          {featured && (
            <P className="text-size-sm leading-[1.55] text-white/85">
              {course.shortDescription}
            </P>
          )}
          <div className="flex flex-wrap gap-2 mt-1">
            {course.durationHours != null && (
              <span className="px-[10px] py-[5px] text-size-xxs font-medium leading-[1.4] tracking-[0.5px] uppercase rounded bg-white/5 border border-white/30 backdrop-blur-[10px] text-white">
                {course.durationHours}H
              </span>
            )}
            <span className="px-[10px] py-[5px] text-size-xxs font-medium leading-[1.4] tracking-[0.5px] uppercase rounded bg-white/5 border border-white/30 backdrop-blur-[10px] text-white">
              Cohort-based
            </span>
          </div>
        </div>
      </div>
    </a>
  );
};

const ProgramRow = ({ program }: { program: typeof GRANT_PROGRAMS[number] }) => (
  <a
    href={program.href}
    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6 py-5 px-6 md:px-8 border-b border-bluedot-navy/10 last:border-b-0 hover:bg-bluedot-navy/[0.03] transition-colors group"
  >
    <div className="flex flex-col gap-1 flex-1">
      <div className="flex items-center gap-3">
        <P className="text-size-xxs font-medium tracking-[1.5px] uppercase text-bluedot-navy/60">
          {program.track}
        </P>
        {program.status === 'On hiatus' && (
          <span className="text-size-xxs font-medium uppercase tracking-[1px] text-[#8B3147]">
            On hiatus
          </span>
        )}
      </div>
      <P className="text-size-md md:text-size-lg font-medium text-bluedot-navy group-hover:translate-x-0.5 transition-transform duration-200">
        {program.title}
      </P>
      <P className="text-size-sm leading-[1.55] text-bluedot-navy/70 max-w-[680px]">
        {program.goal}
      </P>
    </div>
    <span className="text-bluedot-navy/60 group-hover:text-bluedot-navy text-size-md hidden md:block">→</span>
  </a>
);

const LadderSection = () => {
  const { data: dbCourses, isLoading } = trpc.courses.getAll.useQuery();

  const cohortCourses = (() => {
    if (!dbCourses) return [];
    return COHORT_SLUGS
      .map((slug) => {
        const c = dbCourses.find((x) => x.slug === slug);
        if (!c) return null;
        return {
          slug,
          title: c.title,
          shortDescription: c.shortDescription,
          durationHours: c.durationHours,
        } as CohortCard;
      })
      .filter((c): c is CohortCard => c !== null);
  })();

  const featured = cohortCourses.find((c) => c.slug === 'agi-strategy') ?? cohortCourses[0];
  const others = cohortCourses.filter((c) => c.slug !== featured?.slug);

  return (
    <Section className="py-12 md:py-16 lg:py-24 px-5 bd-md:px-8 lg:px-12 xl:px-16 2xl:px-20">
      <div className="mx-auto max-w-screen-xl flex flex-col gap-10 lg:gap-14">
        {/* Section header */}
        <div className="flex flex-col items-center gap-5 text-center max-w-3xl mx-auto">
          <H2 className="text-[28px] md:text-[36px] lg:text-[44px] xl:text-[52px] leading-[1.1] tracking-[-1px] font-medium text-bluedot-navy">
            Where to start
          </H2>
          <P className="text-size-md leading-[1.6] text-bluedot-navy/75 max-w-2xl">
            We help thousands of people every year find their path into AI safety. Three rungs, depending on where you are.
          </P>
        </div>

        {/* Rung 1 — Learn */}
        <div className="flex flex-col gap-6 lg:gap-8">
          <RungHeader rung={RUNGS[0]!} />
          <FoaiRungCard />
        </div>

        {/* Rung 2 — Engage */}
        <div className="flex flex-col gap-6 lg:gap-8">
          <RungHeader rung={RUNGS[1]!} />
          {isLoading ? (
            <div className="py-8"><ProgressDots /></div>
          ) : featured ? (
            <div className="flex flex-col gap-5 lg:gap-6">
              <div className="lg:max-w-[60%]">
                <CohortCard course={featured} featured />
              </div>
              <div className="flex flex-col gap-3">
                <P className="text-size-xs uppercase tracking-[1.5px] text-bluedot-navy/60">
                  Or, if you have a focus
                </P>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {others.slice(0, 3).map((c) => (
                    <CohortCard key={c.slug} course={c} />
                  ))}
                </div>
              </div>
              <div>
                <a
                  href="/courses/agi-strategy"
                  className="inline-flex items-center gap-2 text-size-sm text-bluedot-navy/70 hover:text-bluedot-navy underline-offset-4 hover:underline"
                >
                  Already know your direction? Skip to AGI Strategy
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          ) : null}
        </div>

        {/* Rung 3 — Lead */}
        <div className="flex flex-col gap-6 lg:gap-8">
          <RungHeader rung={RUNGS[2]!} />
          <div className="rounded-xl border border-bluedot-navy/10 bg-white overflow-hidden">
            {GRANT_PROGRAMS.map((p) => (
              <ProgramRow key={p.slug} program={p} />
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default LadderSection;
