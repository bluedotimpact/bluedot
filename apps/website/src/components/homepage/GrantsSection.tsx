import { CTALinkOrButton, H2, P } from '@bluedot/ui';
import { GRANT_PROGRAMS } from '../grants/grantPrograms';
import { PageListGroup, PageListRow } from '../PageListRow';
import { ROUTES } from '../../lib/routes';

const PROGRAMS_OVERVIEW_URL = `${ROUTES.programs.url}?utm_source=website&utm_campaign=homepage-programs`;

const GrantsSection = () => {
  const activePrograms = GRANT_PROGRAMS.filter((p) => p.status === 'Active');

  return (
    <section className="w-full py-[48px] px-5 bd-md:py-[64px] bd-md:px-8 lg:py-[80px] lg:px-12 xl:py-[96px] xl:px-16 2xl:px-20">
      <div className="mx-auto max-w-screen-xl flex flex-col items-center">
        <div className="max-w-[700px] text-center">
          <H2 className="text-[28px] bd-md:text-[36px] lg:text-[40px] xl:text-[48px] leading-tight tracking-[-1px] font-medium text-bluedot-navy">
            Go beyond a course
          </H2>
          <P className="mt-6 text-[16px] bd-md:text-[18px] leading-[1.6] text-bluedot-navy/80">
            Funding, structured sprints, or a bigger launchpad for the next stage of your work on making AI go well.
          </P>
        </div>

        <PageListGroup className="mt-10 bd-md:mt-12 w-full max-w-[1120px]">
          {activePrograms.map((program) => (
            <PageListRow
              key={program.slug}
              href={`${program.href}?utm_source=website&utm_campaign=homepage-programs`}
              title={program.title}
              summary={program.goal}
            />
          ))}
        </PageListGroup>

        <div className="mt-10 bd-md:mt-12">
          <CTALinkOrButton url={PROGRAMS_OVERVIEW_URL} variant="secondary" withChevron>
            See all programs
          </CTALinkOrButton>
        </div>
      </div>
    </section>
  );
};

export default GrantsSection;
