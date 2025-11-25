import {
  NewText,
  CTALinkOrButton,
} from '@bluedot/ui';
import type { IconType } from 'react-icons';
import { ScheduleRounds } from './ScheduleRounds';

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
  /** Course slug to fetch dynamic schedule rounds from database */
  courseSlug: string;
};

const CourseInformationSection = ({
  title,
  applicationUrl,
  details,
  scheduleCtaText,
  courseSlug,
}: CourseInformationSectionProps) => {
  return (
    <section className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 min-[680px]:px-8 min-[1024px]:px-12 min-[1280px]:px-44 xl:px-40 py-12 min-[680px]:py-16 min-[1280px]:py-24 xl:py-24 flex flex-col items-center gap-12 md:gap-16">
        {/* Section Title */}
        <H2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] text-center font-semibold leading-[125%] text-[#13132E] tracking-[-0.01em]">
          {title}
        </H2>

        {/* White Card Container - Scales with viewport then fixed width on larger screens */}
        <div className="w-[calc(100vw-40px)] min-[680px]:w-[calc(100vw-64px)] lg:w-[928px] xl:w-[1120px] bg-white border border-[rgba(19,19,46,0.1)] rounded-xl py-8 flex flex-col items-center gap-6">
          {/* Course Details List */}
          <div className="flex flex-col w-full">
            {details.map((detail, index) => (
              <div key={detail.label}>
                {detail.isSchedule ? (
                  /* Schedule section  */
                  <div className="flex flex-col min-[680px]:flex-row px-5 min-[680px]:px-8 py-0 gap-6 min-[680px]:gap-6 md:gap-8 items-start w-full">
                    {/* Schedule Label (left column, no icon) */}
                    <div className="min-[680px]:w-[120px] min-[1024px]:w-[144px] xl:w-[160px] shrink-0">
                      <P className="text-[16px] font-semibold leading-[125%] text-[#13132E]">
                        {detail.label}
                      </P>
                    </div>

                    {/* Schedule Content (right column) */}
                    <div className="w-full min-[680px]:flex-1 min-[680px]:min-w-0">
                      <ScheduleRounds
                        courseSlug={courseSlug}
                        applicationUrl={applicationUrl}
                        fallbackContent={(
                          <div className="flex flex-col gap-4">
                            <div className="text-[15px] leading-[160%] text-[#13132E] opacity-80 font-normal">
                              {detail.scheduleDescription}
                            </div>
                            <div className="flex justify-start">
                              <CTALinkOrButton
                                url={applicationUrl}
                                className="px-5 py-[9px] md:px-5 md:py-3 text-size-xs md:text-[16px] font-medium bg-[#2244BB] text-white rounded-md hover:bg-[#1a3399] cursor-pointer transition-colors"
                              >
                                {scheduleCtaText}
                              </CTALinkOrButton>
                            </div>
                          </div>
                        )}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-start px-5 md:px-8 py-0 gap-2 md:gap-8">
                    {/* Label */}
                    <div className="md:w-[120px] min-[1024px]:w-[144px] xl:w-[160px] shrink-0">
                      <P className="text-[16px] font-semibold leading-[125%] text-[#13132E]">
                        {detail.label}
                      </P>
                    </div>

                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <P className="text-[15px] leading-[160%] text-[#13132E] opacity-80 font-normal">
                        {detail.description}
                      </P>
                    </div>
                  </div>
                )}

                {/* Divider */}
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
