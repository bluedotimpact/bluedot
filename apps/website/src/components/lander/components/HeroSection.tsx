import { CTALinkOrButton, H1, P } from '@bluedot/ui';

export type HeroSectionProps = {
  categoryLabel?: string; // Optional course category label
  title: string;
  description: string;
  primaryCta: { text: string; url: string };
  secondaryCta?: { text: string; url: string };
  imageSrc: string;
  imageAlt: string;
  backgroundColor?: string;
  accentColor?: string;
  categoryLabelColor?: string; // Optional override for category label color (defaults to accentColor)
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
  backgroundColor,
  accentColor,
  categoryLabelColor,
}: HeroSectionProps) => {
  const isDark = !!backgroundColor;

  return (
    <section
      className={`w-full ${!isDark ? 'bg-white' : ''}`}
      /* Tailwind can't do dynamic colors from props */
      style={isDark ? { backgroundColor } : undefined}
    >
      <div className="relative">
        {/* Content - uses same centered container as other sections */}
        <div className="max-w-max-width mx-auto px-5 min-[680px]:px-8 min-[1024px]:px-spacing-x">
          <div className="lg:w-1/2 py-8 sm:pt-8 lg:py-0 lg:min-h-[600px] lg:flex lg:items-center">
            <div className="w-full lg:max-w-[512px] space-y-8">

              {/* Text Content */}
              <div className="space-y-5 sm:space-y-4">
                {/* Course Category */}
                {categoryLabel && (
                  isDark ? (
                    <p
                      className="bluedot-p not-prose text-size-md font-semibold tracking-wide"
                      style={{ color: categoryLabelColor || accentColor }}
                    >
                      {categoryLabel}
                    </p>
                  ) : (
                    <P className="text-size-md font-semibold tracking-wide text-bluedot-normal">
                      {categoryLabel}
                    </P>
                  )
                )}

                {/* Title */}
                <H1 className={`text-[32px] sm:text-[40px] sm:leading-tight lg:text-[40px] xl:text-5xl leading-tight font-semibold tracking-[-0.5px] ${isDark ? 'text-white' : 'text-[#13132E]'}`}>
                  {title}
                </H1>

                {/* Description */}
                <P className={`text-size-sm sm:text-lg sm:leading-[1.6] lg:text-lg leading-relaxed opacity-80 ${isDark ? 'text-white' : 'text-[#13132E]'}`}>
                  {description}
                </P>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <CTALinkOrButton
                  url={primaryCta.url}
                  size="small"
                  className={`h-10 lg:h-[50px] px-5 py-2.5 text-[14px] lg:text-[16px] font-medium rounded-md cursor-pointer transition-colors ${isDark ? 'text-[#13132e]' : 'bg-bluedot-normal text-white hover:bg-[#1a3399] focus:bg-[#1a3399]'}`}
                  style={isDark && accentColor ? { backgroundColor: accentColor } : undefined}
                >
                  {primaryCta.text}
                </CTALinkOrButton>

                {secondaryCta && (
                  <CTALinkOrButton
                    url={secondaryCta.url}
                    size="small"
                    className={`h-10 lg:h-[50px] px-5 py-2.5 text-[14px] lg:text-[16px] font-medium rounded-md bg-transparent cursor-pointer transition-colors border ${!isDark ? 'border-[rgba(19,19,46,0.3)] text-[#13132E] hover:border-[rgba(19,19,46,0.5)] hover:bg-[rgba(19,19,46,0.05)] hover:text-[#13132E]' : ''}`}
                    style={isDark && accentColor ? { borderColor: accentColor, color: accentColor } : undefined}
                  >
                    {secondaryCta.text}
                  </CTALinkOrButton>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Image - stacked on mobile, absolutely positioned on lg+ */}
        <div className="h-80 sm:h-[430px] lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:w-1/2 lg:h-auto overflow-hidden">
          <img src={imageSrc} alt={imageAlt} className="size-full object-cover lg:object-center" />
          {/* Noise layer - only for light variant */}
          {!isDark && (
            <div
              className="absolute inset-0 pointer-events-none bg-contain bg-repeat mix-blend-soft-light"
              style={{ backgroundImage: 'url(\'/images/agi-strategy/noise.webp\')' }}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
