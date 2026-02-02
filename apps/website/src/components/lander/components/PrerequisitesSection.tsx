import {
  H2, H3, P, CTALinkOrButton,
} from '@bluedot/ui';
import { ReactNode } from 'react';
import { IconType } from 'react-icons';

export type Prerequisite = {
  icon?: IconType;
  title: string;
  description: ReactNode;
  ctaText?: string;
  ctaUrl?: string;
};

export type PrerequisitesSectionProps = {
  id?: string;
  title?: string;
  prerequisites: Prerequisite[];
  accentColor?: string;
  cta?: {
    text: string;
    url: string;
  };
};

const PrerequisitesSection = ({
  id,
  title = 'Prerequisites',
  prerequisites,
  accentColor = '#1F588A',
  cta,
}: PrerequisitesSectionProps) => {
  return (
    <section id={id} className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 py-12 min-[680px]:px-8 min-[680px]:py-16 min-[1024px]:px-spacing-x min-[1280px]:py-24">
        <H2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] font-semibold leading-[125%] text-[#13132E] text-center mb-12 md:mb-16 tracking-[-0.01em]">
          {title}
        </H2>
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 min-[680px]:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {prerequisites.map((prereq) => {
              const IconComponent = prereq.icon;
              return (
                <div
                  key={prereq.title}
                  className="group flex flex-col gap-4 p-6 rounded-xl bg-white border border-[rgba(19,19,46,0.08)] hover:border-[rgba(19,19,46,0.15)] hover:shadow-sm transition-all duration-200"
                >
                  {IconComponent && (
                    <div
                      className="size-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                      style={{ backgroundColor: `${accentColor}15` }}
                    >
                      <IconComponent
                        size={24}
                        style={{ color: accentColor }}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <H3 className="text-[17px] min-[680px]:text-[18px] font-semibold leading-[130%] text-[#13132E]">
                      {prereq.title}
                    </H3>
                    <P className="text-[15px] leading-[1.65] text-[#13132E]/70">
                      {prereq.description}
                    </P>
                  </div>
                  {prereq.ctaText && prereq.ctaUrl && (
                    <div className="mt-auto pt-2">
                      <CTALinkOrButton
                        url={prereq.ctaUrl}
                        variant="secondary"
                        size="small"
                      >
                        {prereq.ctaText}
                      </CTALinkOrButton>
                    </div>
                  )}
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

export default PrerequisitesSection;
