import { CTALinkOrButton, H1, P } from '@bluedot/ui';

export type HeroSectionProps = {
  categoryLabel?: string; // Optional course category label
  title: string;
  description: string;
  primaryCta: { text: string; url: string };
  secondaryCta?: { text: string; url: string };
  imageSrc: string;
  imageAlt: string;
};

// Main exported component
const HeroSection = ({
  categoryLabel,
  title,
  description,
  primaryCta,
  secondaryCta,
  imageSrc,
  imageAlt,
}: HeroSectionProps) => {
  return (
    <section className="w-full bg-white">
      <div className="flex flex-col sm:pt-8 sm:gap-12 lg:pt-0 lg:gap-0 lg:grid lg:grid-cols-2 lg:h-[600px]">

        {/* Content - Aligned with site sections */}
        <div className="px-5 py-8 sm:px-8 sm:py-0 lg:flex lg:items-center lg:px-12 xl:pl-[max(48px,calc((100vw-1436px)/2+48px))] xl:pr-8">
          <div className="w-full lg:max-w-[512px] space-y-8 sm:space-y-8">

            {/* Text Content */}
            <div className="space-y-5 sm:space-y-4">
              {/* Course Category */}
              {categoryLabel && (
                <P className="text-size-md font-semibold tracking-wide text-bluedot-normal">
                  {categoryLabel}
                </P>
              )}

              {/* Title - Cleaner responsive sizing */}
              <H1 className="text-[32px] sm:text-[40px] sm:leading-tight lg:text-[40px] xl:text-5xl leading-tight font-semibold text-[#13132E] tracking-[-0.5px]">
                {title}
              </H1>

              {/* Description */}
              <P className="text-size-sm sm:text-lg sm:leading-[1.6] lg:text-lg leading-relaxed text-[#13132E] opacity-80">
                {description}
              </P>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <CTALinkOrButton
                url={primaryCta.url}
                size="small"
                className="h-10 lg:h-[50px] px-5 py-2.5 text-[14px] lg:text-[16px] font-medium rounded-md bg-bluedot-normal text-white hover:bg-[#1a3399] focus:bg-[#1a3399] cursor-pointer transition-colors"
              >
                {primaryCta.text}
              </CTALinkOrButton>

              {secondaryCta && (
                <CTALinkOrButton
                  url={secondaryCta.url}
                  size="small"
                  className="h-10 lg:h-[50px] px-5 py-2.5 text-[14px] lg:text-[16px] font-medium rounded-md border border-[rgba(19,19,46,0.3)] text-[#13132E] bg-transparent hover:border-[rgba(19,19,46,0.5)] hover:bg-[rgba(19,19,46,0.05)] hover:text-[#13132E] cursor-pointer transition-colors"
                >
                  {secondaryCta.text}
                </CTALinkOrButton>
              )}
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="h-80 sm:h-[430px] lg:h-full relative overflow-hidden">
          <img src={imageSrc} alt={imageAlt} className="size-full object-cover lg:object-center" />
          {/* Noise layer */}
          <div
            className="absolute inset-0 pointer-events-none bg-contain bg-repeat mix-blend-soft-light"
            style={{ backgroundImage: 'url(\'/images/agi-strategy/noise.webp\')' }}
          />
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
