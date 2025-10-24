import { NewText } from '@bluedot/ui';
import { IconType } from 'react-icons';

const { H2, P } = NewText;

export type TargetAudience = {
  icon: IconType;
  boldText: string;
  description: string;
};

export type WhoIsThisForSectionProps = {
  title?: string;
  targetAudiences: TargetAudience[];
};

const WhoIsThisForSection = ({
  title = 'Who this course is for',
  targetAudiences,
}: WhoIsThisForSectionProps) => {
  return (
    <section className="w-full bg-[#FAFAF7]">
      <div className="max-w-max-width mx-auto px-5 py-12 min-[680px]:px-8 min-[680px]:py-16 md:pt-20 md:pb-16 min-[1024px]:px-spacing-x lg:pt-24 lg:pb-20">
        <H2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] font-semibold leading-[125%] text-[#13132E] text-center mb-12 md:mb-16 tracking-[-0.01em]">
          {title}
        </H2>
        <div className="grid grid-cols-1 min-[680px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {targetAudiences.map(({ icon: IconComponent, boldText, description }) => (
            <div
              key={boldText}
              className="flex flex-col items-start gap-6 min-[680px]:justify-between min-[768px]:justify-start min-[1200px]:gap-0 min-[1200px]:justify-between bg-white border border-[rgba(19,19,46,0.1)] rounded-xl p-8 min-[680px]:h-[288px] mx-auto md:mx-0 max-w-[350px] min-[680px]:max-w-[296px] md:max-w-none min-[1200px]:h-[264px]"
            >
              <div className="size-14 min-[680px]:size-14 bg-[#2244BB] rounded-lg flex items-center justify-center flex-shrink-0">
                <IconComponent className="text-white" size={28} />
              </div>
              <P className="text-[18px] min-[680px]:leading-[160%] leading-[1.6] text-[#13132E]">
                <span className="font-semibold">{boldText}</span>
                <span> {description}</span>
              </P>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhoIsThisForSection;
