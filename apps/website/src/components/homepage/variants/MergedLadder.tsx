import clsx from 'clsx';
import {
  H3, P, Section, ProgressDots,
} from '@bluedot/ui';
import { trpc } from '../../../utils/trpc';
import { COURSE_COLORS, type CourseColorSlug } from '../../../lib/courseColors';
import { GRANT_PROGRAMS } from '../../grants/grantPrograms';
import { PageListGroup, PageListRow } from '../../PageListRow';

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
  title: string;
};

const RUNGS: Rung[] = [
  { number: 1, title: 'Get oriented' },
  { number: 2, title: 'Go deep on a path' },
  { number: 3, title: 'Build something' },
];

const RungHeader = ({ rung }: { rung: Rung }) => (
  <div className="flex items-center gap-4">
    <div className="size-10 rounded-full bg-bluedot-navy text-white font-medium flex items-center justify-center text-size-md">
      {rung.number}
    </div>
    <H3 className="text-[24px] md:text-[30px] lg:text-[36px] leading-[1.2] tracking-[-0.5px] font-medium text-bluedot-navy">
      {rung.title}
    </H3>
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
    <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:gap-12 p-7 md:p-10 lg:p-12 min-h-[240px] items-start lg:items-center">
      <div className="size-14 lg:size-20 flex-shrink-0">
        <img src="/images/courses/future-of-ai-icon.svg" alt="" className="block size-full" />
      </div>
      <div className="flex flex-col gap-3 flex-1">
        <H3 className="text-[22px] md:text-[26px] lg:text-[30px] font-medium tracking-[-0.3px] text-white leading-[1.25]">
          The Future of AI
        </H3>
        <P className="text-size-sm md:text-size-md leading-[1.55] text-white/85 max-w-[520px]">
          Free, self-paced, no application. Finish in an evening with a clearer picture of frontier AI and how to help.
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
      <div className="flex items-center gap-2 text-white text-size-md font-medium group-hover:translate-x-1 transition-transform duration-200 flex-shrink-0">
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
            'font-[450] leading-[1.3] tracking-[-0.3px] text-white',
            featured ? 'text-[22px] md:text-[26px]' : 'text-size-md md:text-[20px]',
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
        } as CohortCard;
      })
      .filter((c): c is CohortCard => c !== null);
  })();

  const featuredCohort = cohortCourses.find((c) => c.slug === 'agi-strategy') ?? cohortCourses[0];
  const otherCohorts = cohortCourses.filter((c) => c.slug !== featuredCohort?.slug);

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
          {isLoading ? (
            <div className="py-8"><ProgressDots /></div>
          ) : featuredCohort ? (
            <div className="flex flex-col gap-5 lg:gap-6">
              <div className="lg:max-w-[60%]">
                <CohortCard course={featuredCohort} featured />
              </div>
              <div className="grid grid-cols-1 bd-md:grid-cols-3 gap-4 md:gap-5">
                {otherCohorts.slice(0, 3).map((c) => (
                  <CohortCard key={c.slug} course={c} />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Rung 3 — Build something */}
        <div className="flex flex-col gap-6 lg:gap-8">
          <RungHeader rung={RUNGS[2]!} />
          <PageListGroup>
            {GRANT_PROGRAMS.map((program) => (
              <PageListRow
                key={program.slug}
                href={program.href}
                title={program.title}
                summary={program.goal}
              />
            ))}
          </PageListGroup>
        </div>
      </div>
    </Section>
  );
};

export default MergedLadder;
