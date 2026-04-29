import { H1 } from '@bluedot/ui';
import { Nav } from './Nav/Nav';

type MarketingHeroProps = {
  title: string;
  subtitle?: string;
};

const MarketingHero = ({ title, subtitle }: MarketingHeroProps) => {
  return (
    <section className="relative w-full min-h-[317px] bd-md:min-h-[366px]">
      <Nav variant="transparent" />
      <img
        src="/images/homepage/hero.webp"
        alt=""
        className="absolute inset-0 size-full object-cover -scale-x-100"
        {...{ fetchpriority: 'high' }}
      />
      <div className="relative z-10 flex flex-col justify-end h-full min-h-[317px] bd-md:min-h-[366px] pb-12 pt-20 bd-md:pb-16">
        <div className="section-base">
          <div className="flex flex-col gap-6 max-w-[780px]">
            <H1 className="bluedot-marketing-hero-h1">
              {title}
            </H1>
            {subtitle && (
              <p className="text-size-sm bd-md:text-size-md lg:text-[20px] leading-[1.55] tracking-[-0.1px] text-white">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketingHero;
