import { CTALinkOrButton } from '@bluedot/ui';
import { H2, P } from '@bluedot/ui/src/Text';
import { ROUTES } from '../../lib/routes';

const StorySection = () => {
  return (
    <section className="bg-white border-b border-[rgba(19,19,46,0.1)] overflow-hidden">
      <style>{`
        :root { --s: 1; }
        @media (min-width: 680px) { :root { --s: 1.41; } }
        @media (min-width: 1280px) { :root { --s: 1.73; } }
        @media (min-width: 1440px) { :root { --s: 1.96; } }
        @media (min-width: 1536px) { :root { --s: 2.0; } }

        .story-decorative {
          left: calc(-79px * var(--s));
          top: calc(-122px * var(--s));
          width: calc(314px * var(--s));
          height: calc(314px * var(--s));
        }

        .story-large {
          left: calc(43px * var(--s));
          top: calc(25px * var(--s));
          width: calc(236px * var(--s));
          height: calc(229px * var(--s));
        }

        .story-small {
          left: 0;
          top: 0;
          width: calc(106px * var(--s));
          height: calc(125px * var(--s));
        }
      `}
      </style>

      <div className="flex flex-col min-[1024px]:flex-row items-center justify-center gap-16 min-[1024px]:gap-20 min-[1280px]:gap-[94px] min-[1440px]:gap-[120px] py-12 px-5 min-[680px]:py-16 min-[680px]:px-8 min-[1024px]:py-20 min-[1024px]:px-12 min-[1280px]:py-24 min-[1280px]:px-16 min-[1440px]:px-20 max-w-[1360px] mx-auto">
        <div className="relative shrink-0 w-[278px] aspect-[278/254] min-[680px]:w-[394px] min-[1280px]:w-[482px] min-[1440px]:w-[547px] 2xl:w-[556px]">
          <img
            src="/images/homepage/decorative-vector.svg"
            alt=""
            aria-hidden="true"
            className="absolute story-decorative"
          />
          <img
            src="/images/homepage/large-photo.png"
            alt="BlueDot team members at an event"
            className="absolute story-large rounded-xl border border-[rgba(19,19,46,0.1)] object-cover object-center"
          />
          <img
            src="/images/logo/BlueDot_Impact_Icon.svg"
            alt="BlueDot Impact"
            className="absolute story-small rounded-xl border border-[rgba(19,19,46,0.1)] object-contain object-center bg-white p-10"
          />
        </div>

        <div className="flex flex-col items-start gap-12 min-[680px]:gap-8 min-[1024px]:flex-1">
          <H2 className="text-[28px] min-[680px]:text-[36px] min-[1024px]:text-[40px] min-[1280px]:text-[48px] leading-tight tracking-[-1px] font-medium text-center min-[680px]:text-left w-full">
            Who is BlueDot?
          </H2>

          <div className="flex flex-col items-center min-[680px]:items-start gap-8 w-full">
            <P className="text-[16px] min-[680px]:text-[18px] leading-[1.6] opacity-80">
              BlueDot Impact is a non-profit based out of London. We train and accelerate talented people into opportunities that positively impact the trajectory of AI.
            </P>

            <P className="text-[16px] min-[680px]:text-[18px] leading-[1.6] opacity-80">
              Since 2022, we've trained over 5,000 professionals worldwide – from technical staff at frontier AI companies to government policymakers. Our alumni work on critical challenges at organisations like Anthropic, Google DeepMind, and the UK's AI Security Institute. We're a small team, and we've raised $35M.
            </P>

            <CTALinkOrButton
              size="small"
              url={ROUTES.joinUs.url}
              className="h-11 px-3 py-2.5 text-[14px] font-normal tracking-[0.42px] text-white bg-[#0033CC] rounded-md hover:bg-[#0029A3] transition-all duration-200"
            >
              We're hiring
            </CTALinkOrButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StorySection;
