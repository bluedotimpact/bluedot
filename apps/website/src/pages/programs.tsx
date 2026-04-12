import {
  CTALinkOrButton,
  H1,
} from '@bluedot/ui';
import Head from 'next/head';
import Link from 'next/link';
import NewsletterBanner from '../components/homepage/NewsletterBanner';
import { Nav } from '../components/Nav/Nav';
import { ROUTES } from '../lib/routes';
import { formatAmountUsd } from '../lib/utils';
import { trpc } from '../utils/trpc';

type ProgramItem = {
  id: string;
  name: string;
  track: string;
  status: 'Active' | 'On hiatus';
  href: string;
  summary: string;
  detail: string;
  ctaLabel: string;
};

const ProgramsHero = () => {
  return (
    <section className="relative w-full min-h-[317px] min-[680px]:min-h-[366px]">
      <Nav variant="transparent" />
      <img
        src="/images/homepage/hero.webp"
        alt=""
        className="absolute inset-0 size-full object-cover -scale-x-100"
        {...{ fetchpriority: 'high' }}
      />

      <div className="relative z-10 flex h-full min-h-[317px] flex-col justify-end px-5 pb-12 pt-20 min-[680px]:min-h-[366px] min-[680px]:px-8 min-[680px]:pb-16 min-[680px]:pt-20 min-[1024px]:px-12 min-[1280px]:px-16 min-[1920px]:px-0">
        <div className="mx-auto w-full min-[1920px]:max-w-[1360px]">
          <div className="flex max-w-[780px] flex-col gap-6">
            <H1 className="text-[32px] min-[680px]:text-[40px] min-[1024px]:text-[48px] leading-tight font-medium tracking-[-1px] text-white">
              Programs
            </H1>
            <p className="text-size-sm min-[680px]:text-[18px] min-[1024px]:text-[20px] leading-[1.55] tracking-[-0.1px] text-white">
              Go beyond a course. Build, launch, get funded.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const ProgramRow = ({ program }: { program: ProgramItem }) => {
  return (
    <Link
      href={program.href}
      className="group flex flex-col gap-3 min-[680px]:flex-row min-[680px]:items-center min-[680px]:justify-between min-[680px]:gap-6"
    >
      <div className="flex items-stretch gap-4">
        <div className="w-1 flex-shrink-0 rounded-sm bg-bluedot-normal/30 transition-colors group-hover:bg-bluedot-normal group-focus-visible:bg-bluedot-normal" />
        <div>
          <div className="flex flex-col gap-1">
            <p className="text-[11px] leading-[1.2] font-semibold uppercase tracking-[0.5px] text-bluedot-normal">
              {program.track}
            </p>
            <p className="text-[15px] leading-[1.45] font-semibold text-bluedot-navy">
              {program.name}
            </p>
          </div>
          <p className="text-[15px] leading-[1.6] text-bluedot-navy/62">
            {program.summary}
          </p>
          <p className="mt-1 text-[15px] leading-[1.6] text-bluedot-navy/50">
            {program.detail}
          </p>
        </div>
      </div>

      <div className="ml-5 flex shrink-0 items-center text-[15px] leading-[1.6] font-medium text-bluedot-normal min-[680px]:ml-6 min-[680px]:whitespace-nowrap">
        <span className="transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1">
          {program.ctaLabel}
        </span>
        <span className="ml-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          &rarr;
        </span>
      </div>
    </Link>
  );
};

const ProgramGroup = ({ label, programs }: { label: string; programs: ProgramItem[] }) => {
  if (programs.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[15px] font-semibold uppercase tracking-[0.45px] leading-tight text-bluedot-navy text-center min-[680px]:text-left">
        {label}
      </h2>

      <ul className="list-none flex flex-col gap-5">
        {programs.map((program, index) => (
          <li key={program.id}>
            <ProgramRow program={program} />
            {index < programs.length - 1 && (
              <div className="relative mt-5">
                <div className="absolute inset-x-0 h-px bg-bluedot-navy/10" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const ProgramsPage = () => {
  const { data: publicGrantees } = trpc.grants.getAllPublicGrantees.useQuery();

  const fundingGivenOut = publicGrantees?.reduce((sum, grantee) => {
    return sum + (grantee.amountUsd ?? 0);
  }, 0);

  const fundingGivenOutLabel = typeof fundingGivenOut === 'number'
    ? formatAmountUsd(fundingGivenOut)
    : '$50k+';
  const grantsMadeLabel = publicGrantees?.length ? `${publicGrantees.length} public grants` : 'many grants';

  const programs: ProgramItem[] = [
    {
      id: 'rapid-grants',
      name: 'Rapid Grants',
      track: 'Funding',
      status: 'Active',
      href: '/programs/rapid-grants',
      summary: 'Small, fast funding for concrete AI safety work.',
      detail: `Five-minute application, decisions in days, money upfront by default. ${fundingGivenOutLabel} deployed so far across ${grantsMadeLabel}.`,
      ctaLabel: 'Explore program',
    },
    {
      id: 'technical-ai-safety-project-sprint',
      name: 'Technical AI Safety Project Sprint',
      track: 'Build',
      status: 'Active',
      href: '/programs/technical-ai-safety-project-sprint',
      summary: 'A structured sprint for people who need momentum and accountability to ship.',
      detail: '30 hours, expert check-ins, peer accountability, and a public output.',
      ctaLabel: 'Explore program',
    },
    {
      id: 'incubator-week',
      name: 'Incubator Week',
      track: 'Launch',
      status: 'On hiatus',
      href: '/programs/incubator-week',
      summary: 'A concentrated week for stronger founders and operators testing bigger bets.',
      detail: 'Five-day London intensive. All expenses paid. Strong teams pitch for funding on Friday.',
      ctaLabel: 'Learn more',
    },
  ];

  const activePrograms = programs.filter((program) => program.status === 'Active');
  const pausedPrograms = programs.filter((program) => program.status === 'On hiatus');

  return (
    <div className="bg-white min-[680px]:pb-16 min-[1280px]:pb-24">
      <Head>
        <title>Programs | BlueDot Impact</title>
        <meta
          name="description"
          content="Explore BlueDot Impact programs, including Rapid Grants, Incubator Week, and the Technical AI Safety Project Sprint."
        />
      </Head>

      <ProgramsHero />

      <section className="bg-white pt-[40px] px-5 min-[680px]:pt-[48px] min-[680px]:px-8 min-[1024px]:pt-[56px] lg:px-12 min-[1280px]:pt-[64px] xl:px-16 2xl:px-20">
        <div className="flex flex-col items-center gap-6 max-w-screen-xl mx-auto">
          <div className="flex flex-col gap-12 w-full min-[680px]:max-w-[840px] min-[680px]:mx-auto min-[1024px]:gap-14">
            <ProgramGroup label="Active" programs={activePrograms} />
            <ProgramGroup label="On Hiatus" programs={pausedPrograms} />
          </div>

          <div className="flex justify-center pt-6 min-[680px]:pt-8 min-[1024px]:pt-10">
            <CTALinkOrButton
              url={ROUTES.courses.url}
              className="px-4 bg-bluedot-navy/10 text-bluedot-navy hover:text-bluedot-navy text-[15px] font-[450] tracking-[-0.3px] rounded-md hover:bg-bluedot-navy/15"
            >
              Explore courses instead
            </CTALinkOrButton>
          </div>

          <div className="w-full pt-8 min-[680px]:pt-12 min-[1024px]:pt-14">
            <NewsletterBanner />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProgramsPage;
