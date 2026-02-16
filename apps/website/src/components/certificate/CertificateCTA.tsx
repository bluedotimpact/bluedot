import type React from 'react';
import { CTALinkOrButton } from '@bluedot/ui';
import { COURSE_CONFIG } from '../../lib/constants';

type CertificateCTAProps = {
  courseName: string;
  courseSlug: string;
  courseUrl: string;
  nextCohortDate?: string;
  gradient: string;
  accentColor: string;
};

const DEFAULT_ICON_PATH = '/images/certificates/icons/default.svg';
const DISPLAY_FONT_STYLE = { fontFeatureSettings: '\'ss04\' 1' };

export const CertificateCTA: React.FC<CertificateCTAProps> = ({
  courseName,
  courseSlug,
  courseUrl,
  nextCohortDate = 'NEXT COHORT',
  gradient,
  accentColor,
}) => {
  const courseConfig = COURSE_CONFIG[courseSlug];
  const folderSlug = courseConfig?.landerFolder ?? courseSlug;
  const heroImagePath = courseConfig
    ? `/images/lander/${folderSlug}/hero-graphic.png`
    : DEFAULT_ICON_PATH;

  return (
    // Tailwind doesn't support dynamic gradients passed as props
    <div
      className="relative flex w-full md:max-w-[800px] min-h-[596px] md:min-h-[360px] rounded-none md:rounded-[10px] overflow-hidden"
      style={{
        '--cta-accent': accentColor,
        background: gradient,
      } as React.CSSProperties}
    >
      <div className="relative flex flex-col md:flex-row flex-1">
        <div className="pt-8 px-6 md:p-10 w-full md:w-[450px] flex flex-col gap-[21px] md:gap-6">
          <p className="text-size-xs font-medium leading-[1.6] tracking-[0.24px] uppercase text-[var(--cta-accent)]">
            {nextCohortDate}
          </p>

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h2
                className="text-[36px] font-medium leading-tight tracking-[-0.25px] text-white font-display"
                style={DISPLAY_FONT_STYLE}
              >
                Your certificate<br />awaits. Enroll today.
              </h2>

              <p className="text-size-xs font-normal leading-[1.6] text-white md:text-white/80">
                Join thousands of professionals building expertise in {courseName.toLowerCase()}.
              </p>
            </div>

            <CTALinkOrButton
              url={courseUrl}
              className="h-9 px-4 py-[7px] rounded-[5px] text-size-xs font-medium text-bluedot-navy w-fit bg-[var(--cta-accent)]"
            >
              Start for free
            </CTALinkOrButton>
          </div>
        </div>

        <div className="flex-1 flex items-end justify-center md:items-center md:justify-end overflow-hidden">
          <img
            src={heroImagePath}
            alt=""
            className="w-full max-w-[338px] md:w-[360px] h-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
};
