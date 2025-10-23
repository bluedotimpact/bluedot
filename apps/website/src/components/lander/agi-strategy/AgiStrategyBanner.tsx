import { CTALinkOrButton } from '@bluedot/ui';
import { H3 } from '../../Text';

export interface AgiStrategyBannerProps {
  title: string;
  ctaText: string;
  ctaUrl: string;
}

const AgiStrategyBanner = ({ title, ctaText, ctaUrl }: AgiStrategyBannerProps) => {
  return (
    <div className="relative w-full h-[382px] min-[680px]:h-[360px] mx-auto overflow-hidden rounded-xl bg-[#13132E] bg-[url('/images/agi-strategy/hero-banner-split.png')] bg-cover bg-center xl:max-w-[1118px]">
      {/* Noise layer */}
      <div className="absolute inset-0 pointer-events-none bg-[url('/images/agi-strategy/noise.png')] bg-contain bg-repeat mix-blend-soft-light" />

      <div className="relative flex flex-col items-center justify-center h-full px-14 py-16 gap-8 text-center">
        <img src="/images/agi-strategy/bluedot-icon.svg" alt="BlueDot" className="w-8 h-[30px]" />

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
  );
};

export default AgiStrategyBanner;
