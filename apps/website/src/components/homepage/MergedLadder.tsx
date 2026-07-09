import clsx from 'clsx';
import {
  H3, P, Section, ProgressDots,
} from '@bluedot/ui';
import { trpc } from '../../utils/trpc';
import { COURSE_COLORS, type CourseColorSlug } from '../../lib/courseColors';
import { ProgramsList } from '../programs/ProgramsList';
import { ArrowDownIcon } from '../icons';

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
  step: string;
  title: string;
};

const RUNGS: Rung[] = [
  { step: 'Step one', title: 'See where AI is going' },
  { step: 'Step two', title: 'Understand how you can help' },
  { step: 'Step three', title: 'Start contributing' },
];

const RungHeader = ({ rung }: { rung: Rung }) => (
  <div className="flex flex-col gap-3 text-center">
    <P className="text-size-xs font-medium tracking-[1.5px] uppercase text-bluedot-navy/60">
      {rung.step}
    </P>
    <h2
      className="text-size-xl bd-md:text-size-2xl font-medium leading-[125%] text-bluedot-navy tracking-[-1px]"
      style={{ fontFeatureSettings: '\'ss04\' on' }}
    >
      {rung.title}
    </h2>
  </div>
);

const FoaiRungCard = () => (
  <a
    href="/courses/future-of-ai"
    className="relative rounded-xl border border-bluedot-navy/10 overflow-hidden group cursor-pointer block w-full lg:max-w-[50%] mx-auto"
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
    <div className="relative z-10 flex flex-col h-full p-6 md:p-7 min-h-[260px] md:min-h-[300px]">
      <div className="flex-grow">
        <div className="size-14 md:size-16">
          <img src="/images/courses/future-of-ai-icon.svg" alt="" className="block size-full" />
        </div>
      </div>
      <div className="flex flex-col gap-3 mt-5">
        <H3 className="text-size-lg font-medium leading-[1.3] tracking-[-0.3px] text-white">
          The Future of AI
          <span className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
        </H3>
        <P className="text-size-sm leading-[1.55] text-white/85">
          Free, self-paced, no application. Finish in an evening with a clearer picture of frontier AI and how to help.
        </P>
        <div className="flex flex-wrap gap-2 mt-1">
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
    </div>
  </a>
);

type CohortCardData = {
  slug: CourseColorSlug;
  title: string;
  shortDescription: string;
  durationHours?: number | null;
};

const CohortCard = ({ course, featured = false }: { course: CohortCardData; featured?: boolean }) => {
  const colors = COURSE_COLORS[course.slug];
  return (
    <a
      href={`/courses/${course.slug}`}
      className="relative rounded-xl border border-bluedot-navy/10 overflow-hidden group cursor-pointer block h-full"
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
        'relative z-10 flex flex-col h-full p-6 md:p-7',
        featured ? 'min-h-[260px] md:min-h-[300px]' : 'min-h-[260px] md:min-h-[280px]',
      )}
      >
        <div className="flex-grow">
          <div className={clsx(featured ? 'size-14 md:size-16' : 'size-12 md:size-14')}>
            <img src={COHORT_ICONS[course.slug]} alt="" className="block size-full" />
          </div>
        </div>
        <div className="flex flex-col gap-3 mt-5">
          <H3 className={clsx(
            'font-medium leading-[1.3] tracking-[-0.3px] text-white',
            featured ? 'text-size-lg' : 'text-size-md md:text-size-lg',
          )}
          >
            {course.title}
            <span className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
          </H3>
          <P className="text-size-sm leading-[1.55] text-white/85">
            {course.shortDescription}
          </P>
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

const MergedLadder = () => {
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
        } as CohortCardData;
      })
      .filter((c): c is CohortCardData => c !== null);
  })();

  const featuredCohort = cohortCourses.find((c) => c.slug === 'agi-strategy') ?? cohortCourses[0];
  const otherCohorts = cohortCourses.filter((c) => c.slug !== featuredCohort?.slug);

  let rungTwoContent: React.ReactNode = null;
  if (isLoading) {
    rungTwoContent = <div className="py-8"><ProgressDots /></div>;
  } else if (featuredCohort) {
    rungTwoContent = (
      <div className="flex flex-col gap-5 lg:gap-6">
        <div className="lg:max-w-[50%] mx-auto w-full">
          <CohortCard course={featuredCohort} featured />
        </div>
        <div className="flex justify-center">
          <ArrowDownIcon aria-hidden="true" className="text-bluedot-navy/40" />
        </div>
        <div className="grid grid-cols-1 bd-md:grid-cols-3 gap-4 md:gap-5">
          {otherCohorts.slice(0, 3).map((c) => (
            <CohortCard key={c.slug} course={c} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Section className="py-12 md:py-16 lg:py-24 px-5 bd-md:px-8 lg:px-12 xl:px-16 2xl:px-20">
      <div className="mx-auto max-w-screen-xl flex flex-col gap-10 lg:gap-14">
        {/* Rung 1 — Get oriented */}
        <div className="flex flex-col gap-6 lg:gap-8">
          <RungHeader rung={RUNGS[0]!} />
          <FoaiRungCard />
        </div>

        {/* Rung 2 — Go deep on a path */}
        <div className="flex flex-col gap-6 lg:gap-8">
          <RungHeader rung={RUNGS[1]!} />
          {rungTwoContent}
        </div>

        {/* Rung 3 — Build something */}
        <div className="flex flex-col gap-6 lg:gap-8 w-full max-w-[730px] mx-auto">
          <RungHeader rung={RUNGS[2]!} />
          <ProgramsList utmCampaign="homepage-programs" />
        </div>
      </div>
    </Section>
  );
};

export default MergedLadder;
