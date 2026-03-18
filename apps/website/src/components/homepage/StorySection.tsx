import { CTALinkOrButton, H2, P } from '@bluedot/ui';
import { ROUTES } from '../../lib/routes';

const StorySection = () => {
  return (
    <section className="bg-white py-[48px] px-5 min-[680px]:py-[64px] min-[680px]:px-8 min-[1024px]:py-[80px] lg:px-12 min-[1280px]:py-[96px] xl:px-16 2xl:px-20">
      <div className="flex flex-col items-center max-w-2xl mx-auto text-center">
        <H2 className="text-[28px] min-[680px]:text-[36px] min-[1024px]:text-[40px] min-[1280px]:text-[48px] leading-tight tracking-[-1px] font-medium mb-[48px] min-[680px]:mb-[32px]">
          Who is BlueDot?
        </H2>

        <div className="flex flex-col gap-[32px] items-center">
          <div className="flex flex-col">
            <P className="text-[16px] min-[680px]:text-[18px] leading-[1.6] opacity-80 mb-[1em]">
              BlueDot Impact is a non-profit based out of London. We train and accelerate talented people into opportunities that positively impact the trajectory of AI.
            </P>

            <P className="text-[16px] min-[680px]:text-[18px] leading-[1.6] opacity-80 mb-0">
              Since 2022, we've trained over 5,000 professionals worldwide – from technical staff at frontier AI companies to government policymakers. Our alumni work on critical challenges at organisations like Anthropic, Google DeepMind, and the UK's AI Security Institute. We're a small team, and we've raised $35M.
            </P>
          </div>

          <CTALinkOrButton
            size="small"
            url={ROUTES.about.url}
            className="h-[44px] px-[17px] py-[16px] text-[14px] font-normal leading-[18.2px] tracking-[0.42px] text-white bg-[#0033CC] rounded-[6px] hover:bg-[#0029A3] transition-all duration-200"
          >
            Learn more
          </CTALinkOrButton>
        </div>
      </div>
    </section>
  );
};

export default StorySection;
