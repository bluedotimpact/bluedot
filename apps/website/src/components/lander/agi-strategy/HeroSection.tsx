import React from 'react';
import { CTALinkOrButton, NewText } from '@bluedot/ui';

const { H1, P } = NewText;

type HeroSectionProps = {
  categoryLabel?: string; // Optional course category label
  title: string;
  description: string;
  primaryCta: { text: string; url: string };
  secondaryCta: { text: string; url: string };
  visualComponent?: React.ReactNode;
  imageUrl?: string; // Alternative: pass image URL directly for background
};

// Main exported component
const HeroSection = ({
  categoryLabel,
  title,
  description,
  primaryCta,
  secondaryCta,
  visualComponent,
  imageUrl,
}: HeroSectionProps) => {
  return (
    <section className="w-full bg-white">
      <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 lg:h-[600px]">

        {/* Content - Aligned with site sections */}
        <div className="px-5 py-8 lg:flex lg:items-center lg:px-12 xl:pl-[max(48px,calc((100vw-1436px)/2+48px))] xl:pr-8">
          <div className="w-full lg:max-w-[512px] space-y-8">

            {/* Text Content */}
            <div className="space-y-5">
              {/* Course Category */}
              {categoryLabel && (
                <P className="text-size-md font-semibold tracking-wide text-[#2244BB]">
                  {categoryLabel}
                </P>
              )}

              {/* Title - Cleaner responsive sizing */}
              <H1 className="text-[32px] lg:text-[40px] xl:text-5xl leading-tight font-semibold text-[#13132E] tracking-[-0.5px]">
                {title}
              </H1>

              {/* Description */}
              <P className="text-size-md lg:text-lg leading-relaxed text-[#13132E] opacity-80">
                {description}
              </P>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <CTALinkOrButton
                url={primaryCta.url}
                size="small"
                className="h-10 lg:h-[50px] px-5 py-2.5 text-[14px] lg:text-[16px] font-medium rounded-md bg-[#2244BB] text-white hover:bg-[#1a3399] focus:bg-[#1a3399] transition-colors"
              >
                {primaryCta.text}
              </CTALinkOrButton>

              <CTALinkOrButton
                url={secondaryCta.url}
                size="small"
                className="h-10 lg:h-[50px] px-5 py-2.5 text-[14px] lg:text-[16px] font-medium rounded-md border border-[rgba(19,19,46,0.3)] text-[#13132E] bg-transparent hover:border-[rgba(19,19,46,0.5)] hover:bg-[rgba(19,19,46,0.05)] hover:text-[#13132E] transition-colors"
              >
                {secondaryCta.text}
              </CTALinkOrButton>
            </div>
          </div>
        </div>

        {/* Image - Automatically ordered by flex-col-reverse */}
        {(visualComponent || imageUrl) && (
          <div className="h-80 lg:h-full relative overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="size-full object-cover lg:object-left" />
            ) : (
              visualComponent
            )}
          </div>
        )}

      </div>
    </section>
  );
};

export default HeroSection;
