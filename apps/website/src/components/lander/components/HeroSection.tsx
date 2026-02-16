import { CTALinkOrButton, H1, P } from '@bluedot/ui';

type CtaProps = {
  /** Overridden with "Apply by [deadline]" in CourseLander when a deadline exists */
  text: string;
  url: string;
};

export type HeroSectionProps = {
  categoryLabel?: string;
  categoryLabelColor?: string;
  title: string;
  description: string;
  primaryCta: CtaProps;
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
  categoryLabelColor,
  title,
  description,
  primaryCta,
  secondaryCta,
  imageSrc,
  imageAlt,
  gradient,
  accentColor,
  imageAspectRatio,
}: HeroSectionProps) => {
  const hasGradient = !!gradient;
  // Centered layout with constrained image sizing (for pixel-perfect Figma matching)
  const useConstrainedImageLayout = hasGradient && !!imageAspectRatio;
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const effectiveCategoryLabelColor = categoryLabelColor || accentColor;

  const getLayoutType = () => {
    if (useConstrainedImageLayout) {
      return 'constrained';
    }

    if (hasGradient) {
      return 'gradient';
    }

    return 'light';
  };

  const layoutType = getLayoutType();

  return (
    <section
      className={`w-full ${!hasGradient ? 'bg-white' : ''}`}
      style={hasGradient ? { background: gradient } : undefined}
    >
      {layoutType === 'constrained' && (
        /* Constrained image layout: centered on mobile, pixel-perfect image sizing */
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
                    className="bluedot-p not-prose text-[14px] font-medium tracking-[0.28px] leading-[1.6] uppercase"
                    style={{ color: effectiveCategoryLabelColor }}
                  >
                    {categoryLabel}
                  </p>
                )}
                <h1 className="text-[32px] min-[680px]:text-[40px] leading-tight font-semibold tracking-[-0.5px] text-white">
                  {title}
                </h1>
                <p className="text-[16px] min-[680px]:text-[18px] leading-[1.6] opacity-80 text-white whitespace-pre-line">
                  {description}
                </p>
              </div>

              {/* CTA Buttons - stacked on mobile, side-by-side on tablet */}
              <div className="flex flex-col min-[680px]:flex-row gap-3 w-full min-[680px]:w-auto min-[680px]:justify-center">
                <CTALinkOrButton
                  url={primaryCta.url}
                  variant="unstyled"
                  className="h-[50px] px-5 py-3 text-[16px] font-medium rounded-md cursor-pointer transition-all text-bluedot-navy w-full min-[680px]:w-auto hover:brightness-90"
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
            <div className="w-3/5 min-h-[600px] flex items-center pt-[var(--nav-height-desktop)] pr-[200px]">
              <div className="w-full space-y-8">
                <div className="space-y-4">
                  {categoryLabel && (
                    <p
                      className="bluedot-p not-prose text-[14px] font-medium tracking-[0.28px] leading-[1.6] uppercase"
                      style={{ color: effectiveCategoryLabelColor }}
                    >
                      {categoryLabel}
                    </p>
                  )}
                  <H1 className="text-[40px] xl:text-5xl leading-tight font-semibold tracking-[-0.5px] text-white">
                    {title}
                  </H1>
                  <P className="text-size-md leading-[1.6] opacity-80 text-white whitespace-pre-line">
                    {description}
                  </P>
                </div>

                <div className="flex gap-3">
                  <CTALinkOrButton
                    url={primaryCta.url}
                    variant="unstyled"
                    className="h-[50px] px-5 py-2.5 text-[16px] font-medium rounded-md cursor-pointer transition-all text-bluedot-navy hover:brightness-90"
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
      )}
      {layoutType === 'gradient' && (
        /* Gradient with standard layout: image extends to viewport edge */
        <div className="relative">
          <div className="max-w-max-width mx-auto px-5 min-[680px]:px-8 min-[1024px]:px-spacing-x">
            <div className="py-8 sm:pt-8 lg:py-0 lg:w-1/2 lg:min-h-[600px] lg:flex lg:items-center">
              <div className="w-full lg:max-w-[512px] space-y-8">

                {/* Text Content */}
                <div className="space-y-5 sm:space-y-4">
                  {categoryLabel && (
                    <p
                      className="bluedot-p not-prose text-[14px] font-medium tracking-[0.28px] leading-[1.6] uppercase"
                      style={{ color: effectiveCategoryLabelColor }}
                    >
                      {categoryLabel}
                    </p>
                  )}

                  <H1 className="text-[32px] sm:text-[40px] sm:leading-tight lg:text-[40px] xl:text-5xl leading-tight font-semibold tracking-[-0.5px] text-white">
                    {title}
                  </H1>

                  <P className="text-size-sm sm:text-lg sm:leading-[1.6] lg:text-lg leading-relaxed opacity-80 text-white whitespace-pre-line">
                    {description}
                  </P>
                </div>

                {/* CTA Buttons */}
                <div className="flex gap-3">
                  <CTALinkOrButton
                    url={primaryCta.url}
                    size="small"
                    className="h-10 lg:h-[50px] px-5 py-2.5 text-[14px] lg:text-[16px] font-medium rounded-md cursor-pointer transition-colors text-bluedot-navy hover:brightness-90"
                    style={accentColor ? { backgroundColor: accentColor } : undefined}
                  >
                    {primaryCta.text}
                  </CTALinkOrButton>

                  {secondaryCta && (
                    <CTALinkOrButton
                      url={secondaryCta.url}
                      size="small"
                      className="h-10 lg:h-[50px] px-5 py-2.5 text-[14px] lg:text-[16px] font-medium rounded-md bg-transparent cursor-pointer transition-colors border hover:bg-white/10"
                      style={accentColor ? { borderColor: accentColor, color: accentColor } : undefined}
                    >
                      {secondaryCta.text}
                    </CTALinkOrButton>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Image - stacked on mobile, absolutely positioned to viewport edge on lg+ */}
          <div className="h-80 sm:h-[430px] lg:absolute lg:right-0 lg:inset-y-0 lg:w-1/2 lg:h-auto overflow-hidden">
            {/* Workaround for bug with camelcase `fetchPriority`: https://github.com/facebook/react/issues/25682 */}
            <img src={imageSrc} alt={imageAlt} className="size-full object-cover lg:object-center" {...{ fetchpriority: 'high' }} />
          </div>
        </div>
      )}
      {layoutType === 'light' && (
        /* Light variant: image extends to viewport edge */
        <div className="relative">
          <div className="max-w-max-width mx-auto px-5 min-[680px]:px-8 min-[1024px]:px-spacing-x">
            <div className="py-8 sm:pt-8 lg:py-0 lg:w-1/2 lg:min-h-[600px] lg:flex lg:items-center">
              <div className="w-full lg:max-w-[512px] space-y-8">

                {/* Text Content */}
                <div className="space-y-5 sm:space-y-4">
                  {categoryLabel && (
                    <p
                      className="bluedot-p not-prose text-[14px] font-medium tracking-[0.28px] leading-[1.6] uppercase text-bluedot-normal"
                      style={{ color: effectiveCategoryLabelColor }}
                    >
                      {categoryLabel}
                    </p>
                  )}

                  <H1 className="text-[32px] sm:text-[40px] sm:leading-tight lg:text-[40px] xl:text-5xl leading-tight font-semibold tracking-[-0.5px] text-bluedot-navy">
                    {title}
                  </H1>

                  <P className="text-size-sm sm:text-lg sm:leading-[1.6] lg:text-lg leading-relaxed text-bluedot-navy/80 whitespace-pre-line">
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
                      className="h-10 lg:h-[50px] px-5 py-2.5 text-[14px] lg:text-[16px] font-medium rounded-md bg-transparent cursor-pointer transition-colors border border-bluedot-navy/30 text-bluedot-navy hover:border-bluedot-navy/50 hover:bg-bluedot-navy/5 hover:text-bluedot-navy"
                    >
                      {secondaryCta.text}
                    </CTALinkOrButton>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Image - stacked on mobile, absolutely positioned to viewport edge on lg+ */}
          <div className="h-80 sm:h-[430px] lg:absolute lg:right-0 lg:inset-y-0 lg:w-1/2 lg:h-auto overflow-hidden">
            {/* Workaround for bug with camelcase `fetchPriority`: https://github.com/facebook/react/issues/25682 */}
            <img src={imageSrc} alt={imageAlt} className="size-full object-cover lg:object-center" {...{ fetchpriority: 'high' }} />
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
