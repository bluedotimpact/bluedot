import { CTALinkOrButton, H3 } from '@bluedot/ui';

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
    <section className="w-full bg-white pb-12 min-[680px]:pb-16 min-[1024px]:pb-16 min-[1280px]:pb-24">
      <div className="max-w-max-width mx-auto px-5 min-[680px]:px-8 lg:px-spacing-x">
        <div
          className="relative w-full h-[382px] min-[680px]:h-[360px] mx-auto overflow-hidden rounded-xl bg-[#13132E] bg-cover bg-center xl:max-w-[1118px]"
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

            <H3 className="max-w-[238px] min-[680px]:max-w-[496px] text-[20px] min-[680px]:text-[36px] font-[600] text-white leading-[140%] min-[680px]:leading-[125%]">
              {title}
            </H3>

            <CTALinkOrButton
              variant="ghost"
              className="text-[16px] font-medium leading-[24px] px-5 py-3 h-12 bg-white text-[#13132E] rounded-md hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-bluedot-normal"
              url={ctaUrl}
            >
              {ctaText}
            </CTALinkOrButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingBanner;
