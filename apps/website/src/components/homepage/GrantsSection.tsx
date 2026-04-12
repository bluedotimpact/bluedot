import { CTALinkOrButton, H2, P } from '@bluedot/ui';
import { ROUTES } from '../../lib/routes';

const RAPID_GRANTS_URL = `${ROUTES.programs.url}/rapid-grants?utm_source=website&utm_campaign=homepage-grants`;
const PROGRAMS_OVERVIEW_URL = `${ROUTES.programs.url}?utm_source=website&utm_campaign=homepage-grants`;

const GrantsSection = () => {
  return (
    <section className="w-full bg-white py-[48px] px-5 min-[680px]:py-[64px] min-[680px]:px-8 min-[1024px]:py-[80px] lg:px-12 min-[1280px]:py-[96px] xl:px-16 2xl:px-20">
      <div className="mx-auto grid max-w-screen-xl gap-10 min-[960px]:grid-cols-[minmax(0,1fr)_420px] min-[960px]:items-center min-[1280px]:gap-14">
        <div className="max-w-[640px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#2A5FA8]">
            Grants
          </p>
          <H2 className="mt-4 text-[28px] min-[680px]:text-[36px] min-[1024px]:text-[40px] min-[1280px]:text-[48px] leading-tight tracking-[-1px] font-medium text-bluedot-navy">
            Need funding to keep moving?
          </H2>
          <div className="mt-6 flex flex-col gap-5">
            <P className="text-[16px] min-[680px]:text-[18px] leading-[1.6] text-bluedot-navy/80">
              Rapid Grants back concrete AI safety work in the BlueDot community: research projects, events, community building, travel, tooling, and more.
            </P>
            <P className="text-[16px] min-[680px]:text-[18px] leading-[1.6] text-bluedot-navy/80">
              Five-minute application, decisions in days, money upfront by default.
            </P>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <CTALinkOrButton url={RAPID_GRANTS_URL}>
              Apply for Rapid Grants
            </CTALinkOrButton>
            <CTALinkOrButton url={PROGRAMS_OVERVIEW_URL} variant="secondary" withChevron>
              See all programs
            </CTALinkOrButton>
          </div>
        </div>

        <a
          href={RAPID_GRANTS_URL}
          className="group relative block overflow-hidden rounded-[8px] border border-bluedot-navy/10 bg-[#F4F8FD] min-[960px]:justify-self-end"
        >
          <img
            src="/images/community-values/people.png"
            alt="BlueDot community members in conversation"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </a>
      </div>
    </section>
  );
};

export default GrantsSection;
