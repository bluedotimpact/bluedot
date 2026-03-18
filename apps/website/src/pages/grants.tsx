import {
  Breadcrumbs,
  H1,
  type BluedotRoute,
} from '@bluedot/ui';
import Head from 'next/head';
import { Nav } from '../components/Nav/Nav';
import GrantProgramCard from '../components/grants/GrantProgramCard';
import GrantProgramViewTransitions from '../components/grants/GrantProgramViewTransitions';
import {
  GRANT_PROGRAMS,
  RAPID_GRANT_APPLICATION_URL,
} from '../components/grants/grantPrograms';
import LandingBanner from '../components/lander/components/LandingBanner';
import { ROUTES } from '../lib/routes';
import { formatAmountUsd } from '../lib/utils';
import { trpc } from '../utils/trpc';

const CURRENT_ROUTE: BluedotRoute = {
  title: 'Grants',
  url: '/grants',
  parentPages: [ROUTES.home],
};

const FEATURED_RAPID_GRANT_PROJECT_NAME = 'The Introspection Gap';

const GrantsHero = () => {
  return (
    <section className="relative w-full min-h-[317px] min-[680px]:min-h-[366px]">
      <Nav variant="transparent" />
      <img
        src="/images/homepage/hero.webp"
        alt=""
        className="absolute inset-0 size-full object-cover -scale-x-100"
        {...{ fetchpriority: 'high' }}
      />
      <div className="relative z-10 flex flex-col justify-end h-full min-h-[317px] min-[680px]:min-h-[366px] pb-12 pt-20 min-[680px]:pb-16 min-[680px]:pt-20">
        <div className="w-full mx-auto max-w-max-width px-spacing-x">
          <div className="flex flex-col gap-6 max-w-[780px]">
            <H1 className="text-[32px] min-[680px]:text-[40px] min-[1024px]:text-[48px] leading-tight font-medium tracking-[-1px] text-white">
              Our grantmaking
            </H1>
            <p className="text-size-sm min-[680px]:text-[18px] min-[1024px]:text-[20px] leading-[1.55] tracking-[-0.1px] text-white">
              Funding people and projects that help build the workforce that protects humanity.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const GrantsOverviewPage = () => {
  const { data: publicGrantees } = trpc.grants.getAllPublicGrantees.useQuery();
  const featuredGrant = publicGrantees?.find((grant) => grant.projectTitle === FEATURED_RAPID_GRANT_PROJECT_NAME)
    ?? publicGrantees?.[0];

  const featuredRapidGrant = featuredGrant
    ? {
      title: featuredGrant.projectTitle,
      summary: featuredGrant.projectSummary ?? '',
      meta: `${featuredGrant.granteeName}${featuredGrant.amountUsd != null ? ` • ${formatAmountUsd(featuredGrant.amountUsd)}` : ''}`,
      url: featuredGrant.link,
    }
    : undefined;

  return (
    <div className="bg-white">
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="Overview of BlueDot Impact's grant programs, including Rapid Grants, the AGI Strategy Fund, and The Bridge."
        />
      </Head>

      <GrantProgramViewTransitions />
      <GrantsHero />
      <Breadcrumbs route={CURRENT_ROUTE} />

      <section className="w-full bg-color-canvas">
        <div className="mx-auto max-w-max-width px-5 min-[680px]:px-8 lg:px-spacing-x py-12 min-[680px]:py-16">
          <div className="grid gap-6 min-[960px]:grid-cols-12">
            {GRANT_PROGRAMS.map((program, index) => (
              <GrantProgramCard
                slug={program.slug}
                key={program.title}
                title={program.title}
                goal={program.goal}
                scope={program.scope}
                scopeLabel={program.scopeLabel}
                href={program.href}
                status={program.status}
                emphasis={index === 0 ? 'primary' : 'secondary'}
                className={index === 0 ? 'min-[960px]:col-span-12' : 'min-[960px]:col-span-6'}
                applyUrl={program.slug === 'rapid' ? RAPID_GRANT_APPLICATION_URL : undefined}
                example={program.slug === 'rapid' ? featuredRapidGrant : undefined}
              />
            ))}
          </div>
        </div>
      </section>

      <LandingBanner
        title="Funding to build the workforce that protects humanity"
        ctaText="Explore Rapid Grants"
        ctaUrl="/grants/rapid"
        imageSrc="/images/courses/courses-gradient.webp"
        imageAlt="BlueDot grants banner"
        iconSrc="/images/logo/BlueDot_Impact_Icon_White.svg"
        iconAlt="BlueDot icon"
        noiseImageSrc="/images/agi-strategy/noise.webp"
      />
    </div>
  );
};

export default GrantsOverviewPage;
