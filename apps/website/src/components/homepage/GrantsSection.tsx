import { CTALinkOrButton, H2, P } from '@bluedot/ui';
import { ROUTES } from '../../lib/routes';

const RAPID_GRANTS_URL = `${ROUTES.programs.url}/rapid-grants?utm_source=website&utm_campaign=homepage-programs`;
const PROGRAMS_OVERVIEW_URL = `${ROUTES.programs.url}?utm_source=website&utm_campaign=homepage-programs`;

const GrantsSection = () => {
  return (
    <section className="w-full bg-white py-[48px] px-5 min-[680px]:py-[64px] min-[680px]:px-8 min-[1024px]:py-[80px] lg:px-12 min-[1280px]:py-[96px] xl:px-16 2xl:px-20">
      <div className="mx-auto flex max-w-[760px] flex-col items-center text-center">
        <div className="max-w-[700px]">
          <H2 className="text-[28px] min-[680px]:text-[36px] min-[1024px]:text-[40px] min-[1280px]:text-[48px] leading-tight tracking-[-1px] font-medium text-bluedot-navy">
            Go beyond a course
          </H2>
          <P className="mt-6 text-[16px] min-[680px]:text-[18px] leading-[1.6] text-bluedot-navy/80">
            Funding, structured sprints, or a bigger launchpad for the next stage of your work on making AI go well. Explore what programs we are running currently, or go straight to Rapid Grants if you need money to keep moving.
          </P>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <CTALinkOrButton url={PROGRAMS_OVERVIEW_URL}>
              Explore programs
            </CTALinkOrButton>
            <CTALinkOrButton url={RAPID_GRANTS_URL} variant="secondary" withChevron>
              Rapid Grants
            </CTALinkOrButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GrantsSection;
