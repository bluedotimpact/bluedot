import {
  CTALinkOrButton, H2, H3, P,
} from '@bluedot/ui';
import { ReactNode } from 'react';
import { IconType } from 'react-icons';

export type CourseOutcome = {
  icon: IconType;
  title: string;
  description: ReactNode;
};

export type CourseOutcomesSectionProps = {
  id?: string;
  title?: string;
  outcomes: CourseOutcome[];
  accentColor?: string;
  cta?: {
    text: string;
    url: string;
  };
};

const CourseOutcomesSection = ({
  id,
  title = "What you'll get",
  outcomes,
  accentColor = '#1F588A',
  cta,
}: CourseOutcomesSectionProps) => {
  return (
    <section id={id} className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 py-12 min-[680px]:px-8 min-[680px]:py-16 min-[1024px]:px-spacing-x min-[1280px]:py-24">
        <H2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] font-semibold leading-[125%] text-bluedot-navy text-center mb-12 md:mb-16 tracking-[-0.01em]">
          {title}
        </H2>
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-wrap justify-center gap-6 lg:gap-8">
            {outcomes.map((outcome) => {
              const IconComponent = outcome.icon;

              return (
                <div
                  key={outcome.title}
                  className="group flex flex-col gap-4 p-6 rounded-xl border border-bluedot-navy/8 bg-white hover:border-bluedot-navy/15 hover:shadow-sm transition-all duration-200 w-full min-[680px]:w-[calc(50%-12px)] lg:w-[calc(33.333%-22px)]"
                >
                  <div
                    className="size-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    <IconComponent
                      size={24}
                      style={{ color: accentColor }}
                    />
                  </div>
                  <div className="space-y-2">
                    <H3 className="text-[17px] min-[680px]:text-[18px] font-semibold leading-[130%] text-bluedot-navy">
                      {outcome.title}
                    </H3>
                    <P className="text-[15px] leading-[1.65] text-bluedot-navy/70">
                      {outcome.description}
                    </P>
                  </div>
                </div>
              );
            })}
          </div>

          {cta && (
            <div className="flex justify-center mt-10 md:mt-12">
              <CTALinkOrButton
                url={cta.url}
                variant="primary"
                className="!px-8 !py-3 !text-base"
              >
                {cta.text}
              </CTALinkOrButton>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CourseOutcomesSection;
