import {
  NewText,
  CTALinkOrButton,
} from '@bluedot/ui';
import type { IconType } from 'react-icons';

const { H2, P } = NewText;

export type CourseDetail = {
  /** Icon component from react-icons (e.g., PiGraduationCap, PiClockClockwise) */
  icon: IconType;
  /** Label/heading for this detail (e.g., "Options", "Commitment") */
  label: string;
  /** Main description content */
  description: React.ReactNode;
  /** Set to true for the schedule item to enable special layout with CTA button */
  isSchedule?: boolean;
  /** Schedule-specific description (only used when isSchedule is true) */
  scheduleDescription?: React.ReactNode;
};

export type CourseInformationSectionProps = {
  /** Section heading displayed at the top */
  title: string;
  /** Application URL (should include UTM parameters if applicable) */
  applicationUrl: string;
  /** Array of course details to display (format, commitment, facilitator, etc.) */
  details: CourseDetail[];
  /** Text for the CTA button in the schedule section */
  scheduleCtaText: string;
};

const CourseInformationSection = ({
  title,
  applicationUrl,
  details,
  scheduleCtaText,
}: CourseInformationSectionProps) => {
  return (
    <section className="w-full bg-[#FAFAF7]">
      <div className="max-w-max-width mx-auto px-5 min-[680px]:px-8 lg:px-spacing-x py-12 min-[680px]:py-16 lg:pt-24 lg:pb-20 flex flex-col items-center gap-12 md:gap-16">
        {/* Section Title */}
        <H2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] text-center font-semibold leading-[125%] text-[#13132E] tracking-[-0.01em]">
          {title}
        </H2>

        {/* White Card Container - Fixed width on larger screens, responsive on mobile */}
        <div className="w-full lg:w-[928px] bg-white border border-[rgba(19,19,46,0.1)] rounded-xl py-8 flex flex-col items-center gap-6">
          {/* Course Details List */}
          <div className="flex flex-col w-full">
            {details.map((detail, index) => (
              <div key={detail.label}>
                {detail.isSchedule ? (
                  /* Special layout for Schedule item */
                  <div className="flex flex-col px-6 md:px-8 py-0 gap-4 md:gap-6">
                    {/* Schedule header and description in standard two-column layout */}
                    <div className="flex flex-col md:flex-row items-start gap-4 md:gap-8">
                      {/* Icon and Label */}
                      <div className="flex items-center gap-3 md:min-w-[240px]">
                        <div className="text-[#13132E]">
                          <detail.icon className="size-6" />
                        </div>
                        <P className="text-[16px] font-semibold leading-[125%] text-[#13132E]">
                          {detail.label}
                        </P>
                      </div>

                      {/* Description text only */}
                      <div className="flex-1">
                        <div className="text-[16px] leading-[160%] text-[#13132E] opacity-80 font-normal">
                          {detail.scheduleDescription}
                        </div>
                      </div>
                    </div>

                    {/* Button centered across full width */}
                    <div className="flex justify-start md:justify-center">
                      <CTALinkOrButton
                        url={applicationUrl}
                        className="px-5 py-[9px] md:px-5 md:py-3 text-size-xs md:text-[16px] font-medium bg-[#2244BB] text-white rounded-md hover:bg-[#1a3399] cursor-pointer transition-colors"
                      >
                        {scheduleCtaText}
                      </CTALinkOrButton>
                    </div>
                  </div>
                ) : (
                  /* Standard layout for other items */
                  <div className="flex flex-col md:flex-row items-start px-6 md:px-8 py-0 gap-4 md:gap-8">
                    {/* Icon and Label */}
                    <div className="flex items-center gap-3 md:min-w-[240px]">
                      <div className="text-[#13132E]">
                        <detail.icon className="size-6" />
                      </div>
                      <P className="text-[16px] font-semibold leading-[125%] text-[#13132E]">
                        {detail.label}
                      </P>
                    </div>

                    {/* Description */}
                    <P className="text-[16px] leading-[160%] text-[#13132E] opacity-80 flex-1 font-normal">
                      {detail.description}
                    </P>
                  </div>
                )}

                {/* Divider - not after last item */}
                {index < details.length - 1 && (
                  <div className="w-full h-px bg-[#13132E] opacity-10 my-6" />
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default CourseInformationSection;
