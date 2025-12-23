import { H2, H3, P } from '@bluedot/ui';
import { IconType } from 'react-icons';
import { ReactNode } from 'react';

export type BenefitCard = {
  icon: IconType;
  title: string;
  description: string | ReactNode;
};

export type CourseBenefitsSectionProps = {
  title: string;
  benefits: BenefitCard[];
};

const CourseBenefitsSection = ({ title, benefits }: CourseBenefitsSectionProps) => {
  return (
    <section className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 py-12 min-[680px]:px-8 min-[680px]:py-16 md:px-spacing-x min-[1280px]:py-24 xl:py-24">
        <H2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] font-semibold leading-[125%] text-[#13132E] text-center mb-16 tracking-[-0.01em]">
          {title}
        </H2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map(({ icon: Icon, title: benefitTitle, description }) => (
            <div key={benefitTitle} className="flex flex-col gap-6">
              <div className="size-14 bg-[#ECF0FF] rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="text-black" size={28} />
              </div>
              <div className="space-y-2">
                <H3 className="text-[18px] font-semibold leading-tight text-[#13132E]">
                  {benefitTitle}
                </H3>
                <P className="text-size-sm leading-[1.6] text-[#13132E] opacity-80">
                  {description}
                </P>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CourseBenefitsSection;
