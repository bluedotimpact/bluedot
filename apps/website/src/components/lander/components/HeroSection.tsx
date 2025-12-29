import { CTALinkOrButton, H1, P } from '@bluedot/ui';

export type HeroSectionProps = {
  categoryLabel?: string;
  title: string;
  description: string;
  primaryCta: { text: string; url: string };
  secondaryCta?: { text: string; url: string };
  imageSrc: string;
  imageAlt: string;
  gradient?: string;
  accentColor?: string;
  imageAspectRatio?: string;
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
  gradient,
  accentColor,
  imageAspectRatio = '1/1',
}: HeroSectionProps) => {
  const hasGradient = !!gradient;

  return (
    <section
      className={`w-full ${!hasGradient ? 'bg-white' : ''}`}
      style={hasGradient ? { background: gradient } : undefined}
    >
      {hasGradient ? (
        /* Gradient variant: single column centered layout for mobile/tablet, side-by-side on desktop */
        <div className="relative max-w-max-width mx-auto px-8 min-[1024px]:pl-[80px] min-[1024px]:pr-0">
          {/* Mobile/Tablet: Single column centered layout */}
          <div className="flex flex-col items-center gap-8 pt-[calc(var(--nav-height-mobile)+32px)] pb-8 min-[680px]:pt-[calc(var(--nav-height-mobile)+48px)] min-[1024px]:hidden">
            {/* Image - centered, sized per breakpoint */}
            <div className="flex items-center justify-center w-[280px] min-[680px]:w-[400px]" style={{ aspectRatio: imageAspectRatio }}>
              <img src={imageSrc} alt={imageAlt} className="size-full object-contain" />
            </div>

            {/* Text Content - centered */}
            <div className="w-full flex flex-col items-center gap-5 text-center">
              <div className="space-y-4">
                {categoryLabel && (
                  <p
                    className="bluedot-p not-prose text-[14px] font-medium tracking-[0.28px] uppercase"
                    style={{ color: accentColor }}
                  >
                    {categoryLabel}
                  </p>
                )}
                <h1 className="text-[32px] min-[680px]:text-[40px] leading-tight font-semibold tracking-[-0.5px] text-white">
                  {title}
                </h1>
                <p className="text-[16px] min-[680px]:text-[18px] leading-[1.6] opacity-80 text-white">
                  {description}
                </p>
              </div>

              {/* CTA Buttons - stacked on mobile, side-by-side on tablet */}
              <div className="flex flex-col min-[680px]:flex-row gap-3 w-full min-[680px]:w-auto min-[680px]:justify-center">
                <CTALinkOrButton
                  url={primaryCta.url}
                  variant="unstyled"
                  className="h-[50px] px-5 py-3 text-[16px] font-medium rounded-md cursor-pointer transition-all text-[#13132e] w-full min-[680px]:w-auto hover:brightness-90"
                  style={accentColor ? { backgroundColor: accentColor } : undefined}
                >
                  {primaryCta.text}
                </CTALinkOrButton>

                {secondaryCta && (
                  <CTALinkOrButton
                    url={secondaryCta.url}
                    variant="unstyled"
                    className="h-[50px] px-5 py-3 text-[16px] font-medium rounded-md bg-transparent cursor-pointer transition-all border w-full min-[680px]:w-auto hover:bg-white/10"
                    style={accentColor ? { borderColor: accentColor, color: accentColor } : undefined}
                  >
                    {secondaryCta.text}
                  </CTALinkOrButton>
                )}
              </div>
            </div>
          </div>

          {/* Desktop: Side-by-side layout with absolute positioned image */}
          <div className="hidden min-[1024px]:block">
            <div className="w-1/2 min-h-[600px] flex items-center pt-[var(--nav-height-desktop)] pr-[24px] min-[1280px]:pr-[152px]">
              <div className="w-full max-w-[512px] space-y-8">
                <div className="space-y-4">
                  {categoryLabel && (
                    <p
                      className="bluedot-p not-prose text-size-md font-semibold tracking-wide"
                      style={{ color: accentColor }}
                    >
                      {categoryLabel}
                    </p>
                  )}
                  <H1 className="text-[40px] xl:text-5xl leading-tight font-semibold tracking-[-0.5px] text-white">
                    {title}
                  </H1>
                  <P className="text-size-lg leading-[1.6] opacity-80 text-white">
                    {description}
                  </P>
                </div>

                <div className="flex gap-3">
                  <CTALinkOrButton
                    url={primaryCta.url}
                    variant="unstyled"
                    className="h-[50px] px-5 py-2.5 text-[16px] font-medium rounded-md cursor-pointer transition-all text-[#13132e] hover:brightness-90"
                    style={accentColor ? { backgroundColor: accentColor } : undefined}
                  >
                    {primaryCta.text}
                  </CTALinkOrButton>

                  {secondaryCta && (
                    <CTALinkOrButton
                      url={secondaryCta.url}
                      variant="unstyled"
                      className="h-[50px] px-5 py-2.5 text-[16px] font-medium rounded-md bg-transparent cursor-pointer transition-all border hover:bg-white/10"
                      style={accentColor ? { borderColor: accentColor, color: accentColor } : undefined}
                    >
                      {secondaryCta.text}
                    </CTALinkOrButton>
                  )}
                </div>
              </div>
            </div>

            {/* Image - absolutely positioned on right side */}
            <div className="absolute right-0 bottom-0 w-1/2 top-[var(--nav-height-desktop)]">
              <img
                src={imageSrc}
                alt={imageAlt}
                className="size-full object-contain"
                style={{ objectPosition: 'right center' }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Default variant: original layout */
        <div className="relative max-w-max-width mx-auto px-5 min-[680px]:px-8 min-[1024px]:px-spacing-x">
          <div className="py-8 sm:pt-8 lg:py-0 lg:w-1/2 lg:min-h-[600px] lg:flex lg:items-center">
            <div className="w-full lg:max-w-[512px] space-y-8">

              {/* Text Content */}
              <div className="space-y-5 sm:space-y-4">
                {/* Course Category */}
                {categoryLabel && (
                  <P className="text-size-md font-semibold tracking-wide text-bluedot-normal">
                    {categoryLabel}
                  </P>
                )}

                {/* Title */}
                <H1 className="text-[32px] sm:text-[40px] sm:leading-tight lg:text-[40px] xl:text-5xl leading-tight font-semibold tracking-[-0.5px] text-[#13132E]">
                  {title}
                </H1>

                {/* Description */}
                <P className="text-size-sm sm:text-lg sm:leading-[1.6] lg:text-lg leading-relaxed opacity-80 text-[#13132E]">
                  {description}
                </P>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <CTALinkOrButton
                  url={primaryCta.url}
                  size="small"
                  className="h-10 lg:h-[50px] px-5 py-2.5 text-[14px] lg:text-[16px] font-medium rounded-md cursor-pointer transition-colors bg-bluedot-normal text-white hover:bg-[#1a3399] focus:bg-[#1a3399]"
                >
                  {primaryCta.text}
                </CTALinkOrButton>

                {secondaryCta && (
                  <CTALinkOrButton
                    url={secondaryCta.url}
                    size="small"
                    className="h-10 lg:h-[50px] px-5 py-2.5 text-[14px] lg:text-[16px] font-medium rounded-md bg-transparent cursor-pointer transition-colors border border-[rgba(19,19,46,0.3)] text-[#13132E] hover:border-[rgba(19,19,46,0.5)] hover:bg-[rgba(19,19,46,0.05)] hover:text-[#13132E]"
                  >
                    {secondaryCta.text}
                  </CTALinkOrButton>
                )}
              </div>
            </div>
          </div>

          {/* Image - stacked on mobile, absolutely positioned on lg+ within max-width container */}
          <div className="h-80 sm:h-[430px] lg:absolute lg:right-0 lg:inset-y-0 lg:w-1/2 lg:h-auto overflow-hidden">
            <img src={imageSrc} alt={imageAlt} className="size-full object-cover lg:object-center" />
            {/* Noise layer */}
            <div
              className="absolute inset-0 pointer-events-none bg-contain bg-repeat mix-blend-soft-light"
              style={{ backgroundImage: 'url(\'/images/agi-strategy/noise.webp\')' }}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
