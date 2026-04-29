import { CTALinkOrButton, H2, P } from '@bluedot/ui';
import { ROUTES } from '../../lib/routes';

const StorySection = () => {
  return (
    <section className="py-[48px] px-5 bd-md:py-[64px] bd-md:px-8 lg:py-[80px] lg:px-12 xl:py-[96px] xl:px-16 2xl:px-20">
      <div className="flex flex-col items-center max-w-2xl mx-auto text-center">
        <H2 className="text-[28px] bd-md:text-[36px] lg:text-[40px] xl:text-[48px] leading-tight tracking-[-1px] font-medium mb-[48px] bd-md:mb-[32px]">
          Who is BlueDot?
        </H2>

        <div className="flex flex-col gap-[32px] items-center">
          <div className="flex flex-col">
            <P className="text-size-sm bd-md:text-size-md leading-[1.6] opacity-80 mb-[1em]">
              BlueDot Impact is a non-profit talent accelerator based in London and San Francisco. We help people build careers and organizations that positively impact the trajectory of AI - through our courses, career support, events, and startup programs.
            </P>

            <P className="text-size-sm bd-md:text-size-md leading-[1.6] opacity-80 mb-0">
              Since 2022, we've trained over 7,000 professionals worldwide, from technical staff at frontier AI labs to government policymakers. Our alumni work on critical challenges at organisations like Anthropic, Google DeepMind, and the UK's AI Security Institute. We're a small team, and we've raised $35M to date.
            </P>
          </div>

          <CTALinkOrButton
            size="small"
            url={ROUTES.about.url}
            className="h-[44px] px-[17px] py-[16px] text-size-xs font-normal leading-[18.2px] tracking-[0.42px] text-white bg-[#0033CC] rounded-[6px] hover:bg-[#0029A3] transition-all duration-200"
          >
            Learn more
          </CTALinkOrButton>
        </div>
      </div>
    </section>
  );
};

export default StorySection;
