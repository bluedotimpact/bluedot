import { CTALinkOrButton, H2, P } from '@bluedot/ui';
import { IconType } from 'react-icons';

export type TargetAudience = {
  icon: IconType;
  boldText: string;
  description: string;
};

export type BottomCta = {
  boldText: string;
  text: string;
  buttonText?: string;
  buttonUrl?: string;
};

export type WhoIsThisForSectionProps = {
  title?: string;
  targetAudiences: TargetAudience[];
  bottomCta?: BottomCta;
};

const WhoIsThisForSection = ({
  title = 'Who this course is for',
  targetAudiences,
  bottomCta,
}: WhoIsThisForSectionProps) => {
  return (
    <section className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 py-12 min-[680px]:px-8 min-[680px]:py-16 min-[1024px]:px-spacing-x min-[1280px]:py-24 xl:py-24">
        <H2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] font-semibold leading-[125%] text-[#13132E] text-center mb-12 md:mb-16 tracking-[-0.01em]">
          {title}
        </H2>
        <div className="grid grid-cols-1 min-[680px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {targetAudiences.map(({ icon: IconComponent, boldText, description }) => (
            <div
              key={boldText}
              className="flex flex-col items-start gap-6 min-[680px]:justify-start min-[768px]:justify-start min-[1200px]:justify-start bg-white border border-[rgba(19,19,46,0.1)] rounded-xl p-8 min-[680px]:h-[288px] mx-auto md:mx-0 max-w-[350px] min-[680px]:max-w-[296px] md:max-w-none min-[1200px]:h-[264px]"
            >
              <div className="size-14 min-[680px]:size-14 bg-bluedot-normal rounded-lg flex items-center justify-center flex-shrink-0">
                <IconComponent className="text-white" size={28} />
              </div>
              <P className="text-[18px] min-[680px]:leading-[160%] leading-[1.6] text-[#13132E]">
                <span className="font-semibold">{boldText}</span>
                <span> {description}</span>
              </P>
            </div>
          ))}
        </div>

        {/* Bottom CTA Section */}
        {bottomCta && (
          <div className="w-full max-w-[924px] mx-auto flex flex-col items-center gap-6 mt-12 md:mt-16">
            <P className="text-size-sm text-[#13132E]/80 text-center">
              <span className="font-semibold">{bottomCta.boldText}</span>
              <span> {bottomCta.text}</span>
            </P>
            {bottomCta.buttonText && bottomCta.buttonUrl && (
              <CTALinkOrButton
                url={bottomCta.buttonUrl}
                variant="primary"
                size="medium"
              >
                {bottomCta.buttonText}
              </CTALinkOrButton>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default WhoIsThisForSection;
