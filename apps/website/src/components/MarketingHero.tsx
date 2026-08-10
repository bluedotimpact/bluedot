import type { ReactNode } from 'react';
import { HeroH1 } from '@bluedot/ui';
import { Nav } from './Nav/Nav';

type MarketingHeroProps = {
  title: string;
  subtitle?: string;
  cta?: ReactNode;
  // Reserves extra space below the nav so titles that wrap to two lines don't
  // crowd it. Opt-in because most heroes have short, single-line titles;
  // mission titles routinely wrap.
  extraTopSpacing?: boolean;
};

const MarketingHero = ({
  title, subtitle, cta, extraTopSpacing = false,
}: MarketingHeroProps) => {
  const topSpacing = extraTopSpacing ? 'pt-24 bd-md:pt-32' : 'pt-20';

  return (
    <section className="relative w-full min-h-[317px] bd-md:min-h-[366px]">
      <Nav variant="transparent" />
      <img
        src="/images/homepage/hero.webp"
        alt=""
        className="absolute inset-0 size-full object-cover -scale-x-100"
        {...{ fetchpriority: 'high' }}
      />
      <div className={`relative z-10 flex flex-col justify-end h-full min-h-[317px] bd-md:min-h-[366px] ${cta ? 'pb-6' : 'pb-12'} ${topSpacing} ${cta ? 'bd-md:pb-8' : 'bd-md:pb-16'}`}>
        <div className="section-base">
          <div className="flex flex-col gap-6 max-w-[780px]">
            <HeroH1 className="text-left">
              {title}
            </HeroH1>
            {subtitle && (
              <p className="text-size-sm bd-md:text-size-md leading-relaxed text-white">
                {subtitle}
              </p>
            )}
            {cta && <div>{cta}</div>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketingHero;
