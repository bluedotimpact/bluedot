import { Button, H3 } from '@bluedot/ui';

export type LandingBannerProps = {
  title: React.ReactNode;
  ctaText: string;
  ctaUrl: string;
  imageSrc: string;
  imageAlt: string;
  iconSrc: string;
  iconAlt: string;
  noiseImageSrc: string;
};

const LandingBanner = ({
  title,
  ctaText,
  ctaUrl,
  imageSrc,
  imageAlt,
  iconSrc,
  iconAlt,
  noiseImageSrc,
}: LandingBannerProps) => {
  return (
    <section className="w-full pb-12 bd-md:pb-16 lg:pb-16 xl:pb-24">
      <div className="max-w-max-width mx-auto px-5 bd-md:px-8 lg:px-spacing-x">
        <div
          className="relative w-full h-[382px] bd-md:h-[360px] mx-auto overflow-hidden rounded-xl bg-dark bg-cover bg-center xl:max-w-[1118px]"
          style={{ backgroundImage: `url('${imageSrc}')` }}
          role="img"
          aria-label={imageAlt}
        >
          <div
            className="absolute inset-0 pointer-events-none bg-contain bg-repeat mix-blend-soft-light"
            style={{ backgroundImage: `url('${noiseImageSrc}')` }}
          />

          <div className="relative flex flex-col items-center justify-center h-full px-14 py-16 gap-8 text-center">
            <img src={iconSrc} alt={iconAlt} className="w-8 h-[30px]" />

            {/* eslint-disable-next-line @bluedot/custom/no-arbitrary-text-size -- deferred design pick: banner H3 with bespoke text-size-md → 36px ramp paired with viewport-specific max-w */}
            <H3 className="max-w-[238px] bd-md:max-w-[496px] text-size-md bd-md:text-[36px] text-on-dark leading-normal bd-md:leading-snug">
              {title}
            </H3>

            <Button
              variant="ghost"
              className="text-size-sm font-medium leading-relaxed px-5 py-3 min-h-12 bg-accent-on-dark text-primary rounded-md hover:bg-accent-on-dark-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
              url={ctaUrl}
            >
              {ctaText}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingBanner;
