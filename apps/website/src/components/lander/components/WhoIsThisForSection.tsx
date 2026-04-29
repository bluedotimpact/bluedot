import { CTALinkOrButton, H2, P } from '@bluedot/ui';
import { type IconType } from 'react-icons';

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
  iconBackgroundColor?: string; // Custom icon background color - defaults to BlueDot blue
};

const WhoIsThisForSection = ({
  title = 'Who this course is for',
  targetAudiences,
  bottomCta,
  iconBackgroundColor,
}: WhoIsThisForSectionProps) => {
  return (
    <section className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 py-12 bd-md:px-8 bd-md:py-16 lg:px-spacing-x xl:py-24">
        <H2 className="text-[28px] bd-md:text-[32px] xl:text-[36px] font-semibold leading-[125%] text-bluedot-navy text-center mb-12 md:mb-16 tracking-[-0.01em]">
          {title}
        </H2>
        <div className="grid grid-cols-1 bd-md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {targetAudiences.map(({ icon: IconComponent, boldText, description }) => (
            <div
              key={boldText}
              className="flex flex-col items-center bd-md:items-start gap-6 bd-md:justify-start bg-white border border-bluedot-navy/10 rounded-xl p-8 bd-md:min-h-[288px] mx-auto md:mx-0 max-w-[350px] bd-md:max-w-[296px] md:max-w-none min-[1200px]:min-h-[264px]"
            >
              <div
                className={`size-14 rounded-lg flex items-center justify-center flex-shrink-0 ${!iconBackgroundColor ? 'bg-bluedot-normal' : ''}`}
                style={iconBackgroundColor ? { backgroundColor: iconBackgroundColor } : undefined}
              >
                <IconComponent className="text-white" size={28} />
              </div>
              <P className="text-size-md leading-[1.6] text-bluedot-navy">
                <span className="font-semibold">{boldText}</span>
                <span> {description}</span>
              </P>
            </div>
          ))}
        </div>

        {/* Bottom CTA Section */}
        {bottomCta && (
          <div className="w-full max-w-[924px] mx-auto flex flex-col items-center gap-6 mt-12 md:mt-16">
            <P className="text-size-sm text-bluedot-navy/80 text-center">
              <span className="font-semibold">{bottomCta.boldText}</span>
              <span> {bottomCta.text}</span>
            </P>
            {bottomCta.buttonText && bottomCta.buttonUrl && (
              <CTALinkOrButton
                url={bottomCta.buttonUrl}
                variant="outline-black"
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
