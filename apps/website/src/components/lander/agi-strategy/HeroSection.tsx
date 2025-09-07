import React from 'react';
import { CTALinkOrButton, NewText } from '@bluedot/ui';
import { PiLightbulb, PiCertificate, PiClockBold } from 'react-icons/pi';

const { H1, P } = NewText;

type CourseMetaData = {
  duration: string;
  certification: string;
  level: string;
};

type HeroSectionProps = {
  metadata: CourseMetaData;
  title: string;
  description: string;
  primaryCta: { text: string; url: string };
  secondaryCta: { text: string; url: string };
  visualComponent?: React.ReactNode;
};

// Main exported component
const HeroSection = ({
  metadata,
  title,
  description,
  primaryCta,
  secondaryCta,
  visualComponent,
}: HeroSectionProps) => {
  return (
    <section className="
      w-full min-h-screen bg-white
      grid grid-cols-1
      sm:min-h-[600px] sm:grid-cols-2
    "
    >

      {/* Visual Component */}
      {visualComponent && (
        <div className="
          w-full h-60 bg-cover bg-center
          order-1
          sm:order-2 sm:h-full sm:min-h-[600px]
        "
        >
          {visualComponent}
        </div>
      )}

      {/* Content Area */}
      <div className="
        w-full px-5 py-8 space-y-8
        order-2
        sm:order-1 sm:pl-12 sm:pr-8 sm:py-12 sm:flex sm:flex-col sm:justify-center
      "
      >

        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-3 justify-start">
          <MetaBadge icon={PiClockBold} text={metadata.duration} />
          <MetaBadge icon={PiCertificate} text={metadata.certification} />
          <MetaBadge icon={PiLightbulb} text={metadata.level} />
        </div>

        {/* Text Content */}
        <div className="space-y-4 text-left">
          <H1 className="
            text-[32px] leading-tight font-semibold text-[#13132E]
            sm:text-5xl sm:leading-[3.75rem] sm:tracking-[-0.5px]
          "
          >
            {title}
          </H1>

          <P className="
            text-[18px] leading-relaxed text-[#13132E] opacity-80
            sm:text-lg sm:leading-[1.6] sm:max-w-lg
          "
          >
            {description}
          </P>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-row gap-3">
          <CTALinkOrButton
            url={primaryCta.url}
            size="small"
            className="
              w-auto h-11 px-5 py-3 text-[14px] font-medium rounded-md
              bg-[#2244BB] text-white
              hover:bg-[#1a3399] focus:bg-[#1a3399] transition-colors duration-200
              sm:h-[3.125rem] sm:text-[16px]
            "
          >
            {primaryCta.text}
          </CTALinkOrButton>

          <CTALinkOrButton
            url={secondaryCta.url}
            size="small"
            className="
              w-auto h-11 px-5 py-3.5 text-[14px] font-medium rounded-md
              border border-[rgba(19,19,46,0.3)] text-[#13132E] bg-transparent
              hover:border-[rgba(19,19,46,0.5)] hover:bg-[rgba(19,19,46,0.05)] hover:text-[#13132E]
              transition-colors duration-200
              sm:h-[3.125rem] sm:text-[16px]
            "
          >
            {secondaryCta.text}
          </CTALinkOrButton>
        </div>
      </div>

    </section>
  );
};

// Badge Component - inline sub-component
type MetaBadgeProps = {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
};

const MetaBadge: React.FC<MetaBadgeProps> = ({ icon: Icon, text }) => (
  <div className="
    flex items-center gap-1.5
    px-2.5 py-1.5 h-[2.125rem]
    border border-gray-200 rounded
  "
  >
    <Icon className="size-[18px] text-[#13132E] opacity-80" />
    <P className="text-size-xs font-normal text-[#13132E] opacity-80">
      {text}
    </P>
  </div>
);

export default HeroSection;
