import React from 'react';

export type Partner = {
  name: string;
  url: string;
  logo: string | null;
  descriptionShort: React.ReactNode;
  descriptionFull: React.ReactNode;
};

export type PartnerSectionProps = {
  /** Section heading displayed at the top */
  title: string;
  /** Array of partners to display */
  partners: Partner[];
};

// Reusable Partner Card Component
const PartnerCard = ({
  partner,
  variant = 'mobile',
  tabIndex,
}: {
  partner: Partner;
  variant?: 'mobile' | 'desktop';
  tabIndex?: number;
}) => {
  const isDesktop = variant === 'desktop';
  const description = isDesktop ? partner.descriptionFull : partner.descriptionShort;

  return (
    <div className={isDesktop ? 'flex flex-col gap-6 md:gap-8 min-h-[174px]' : 'flex flex-col w-[220px] h-[210px] gap-4 flex-shrink-0'}>
      {/* Logo Area */}
      <a
        href={partner.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center h-16 group"
        tabIndex={tabIndex}
      >
        {partner.logo ? (
          <img
            src={partner.logo}
            alt={partner.name}
            className={`object-contain max-w-full ${isDesktop ? 'max-h-[64px]' : 'max-h-[56px]'} transition-opacity duration-200 group-hover:opacity-80`}
          />
        ) : (
          <div className="w-[160px] h-[50px] bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-size-sm font-medium transition-opacity duration-200 group-hover:opacity-80">
            {partner.name}
          </div>
        )}
      </a>

      {/* Description Area */}
      <div className={isDesktop ? 'flex-1' : 'h-[130px]'}>
        <p className="text-bluedot-navy/80 text-size-sm leading-[160%]">
          {description}
        </p>
      </div>
    </div>
  );
};

const PartnerSection = ({ title, partners }: PartnerSectionProps) => {
  return (
    <section className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 min-[680px]:px-8 lg:px-spacing-x py-12 min-[680px]:py-16 min-[1280px]:py-24">

        {/* Section Header */}
        <h2 className="text-[28px] min-[680px]:text-[32px] min-[1280px]:text-[36px] font-semibold leading-[125%] tracking-[-0.01em] text-bluedot-navy text-center mb-12 md:mb-16 max-w-[734px] mx-auto">
          {title}
        </h2>

        {/* Mobile Infinite Scroll Carousel (1024px and below) */}
        <div className="max-lg:block hidden -mx-5 min-[680px]:-mx-8 lg:-mx-spacing-x">
          <div className="w-full inline-flex flex-nowrap overflow-hidden group">
            {/* Duplicate the partners array for infinite scroll */}
            {[1, 2].map((setIndex) => (
              <div
                key={`set-${setIndex}`}
                className="flex items-start gap-12 animate-infinite-scroll pl-12 group-hover:[animation-play-state:paused]"
                aria-hidden={setIndex === 2 ? true : undefined}
              >
                {partners.map((partner, partnerIndex) => (
                  <React.Fragment key={`${partner.name}-${setIndex}`}>
                    <PartnerCard
                      partner={partner}
                      variant="mobile"
                      tabIndex={setIndex === 2 ? -1 : undefined}
                    />
                    {/* Add divider after each partner except the last */}
                    {partnerIndex < partners.length - 1 && (
                      <div className="w-[0.5px] h-[210px] bg-[#231C57] opacity-20 flex-shrink-0" />
                    )}
                  </React.Fragment>
                ))}
                {/* Add final divider after last partner to separate from next set */}
                <div className="w-[0.5px] h-[210px] bg-[#231C57] opacity-20 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Grid (1024px and above) */}
        <div className="lg:grid hidden grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
          {partners.map((partner, index) => (
            <React.Fragment key={partner.name}>
              <PartnerCard partner={partner} variant="desktop" />

              {/* Add divider row after first 3 partners */}
              {index === 2 && (
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                  <div className="border-t border-[#231C57] opacity-20" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnerSection;
