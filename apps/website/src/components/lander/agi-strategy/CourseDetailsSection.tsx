import { NewText, CTALinkOrButton } from '@bluedot/ui';
import {
  PiGraduationCap,
  PiClockClockwise,
  PiChats,
  PiHandHeart,
  PiCalendarDots,
} from 'react-icons/pi';

const { H2, P } = NewText;

const applicationUrl = 'https://web.miniextensions.com/9Kuya4AzFGWgayC3gQaX?utm_source=website_lander';

const CourseDetailsSection = () => {
  const courseDetails = [
    {
      icon: <PiGraduationCap className="size-6" />,
      label: 'Options',
      description: (
        <>
          <span className="font-semibold">Intensive</span>: 6-day course (5h/day)
          <br />
          <span className="font-semibold">Part-time</span>: 6-week course (5h/week)
        </>
      ),
    },
    {
      icon: <PiClockClockwise className="size-6" />,
      label: 'Commitment',
      description: (
        <>
          Each day or week, you will:
          <br />
          <span className="font-semibold">Complete 2-3 hours</span> of reading and writing, and <span className="font-semibold">join ~8 peers in a 2-hour Zoom meeting</span> to discuss the content.
        </>
      ),
    },
    {
      icon: <PiChats className="size-6" />,
      label: 'Facilitator',
      description: 'All discussions will be facilitated by an AI safety expert.',
    },
    {
      icon: <PiHandHeart className="size-6" />,
      label: 'Price',
      description: 'This course is freely available and operates on a "pay-what-you-want" model.',
    },
    {
      icon: <PiCalendarDots className="size-6" />,
      label: 'Schedule',
      description: (
        <>
          New cohorts start every month:
          <br />
          Next round <span className="font-semibold">3rd November</span>, application deadline <span className="font-semibold">26th October</span>
        </>
      ),
    },
  ];

  return (
    <section className="w-full bg-[#FAFAF7]">
      <div className="max-w-max-width mx-auto px-spacing-x py-12 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20 flex flex-col items-center gap-12 md:gap-16">
        {/* Section Title */}
        <H2 className="text-[28px] md:text-[32px] lg:text-[36px] text-center font-semibold leading-[125%] text-[#13132E] tracking-[-0.01em]">
          AGI Strategy Course Details
        </H2>

        {/* White Card Container - Fixed width on larger screens, responsive on mobile */}
        <div className="w-full lg:w-[928px] bg-white border border-[rgba(19,19,46,0.1)] rounded-xl py-8 flex flex-col items-center gap-6">
          {/* Course Details List */}
          <div className="flex flex-col w-full">
            {courseDetails.map((detail, index) => (
              <div key={detail.label}>
                <div className="flex flex-col md:flex-row items-start px-6 md:px-8 py-0 gap-8">
                  {/* Icon and Label */}
                  <div className="flex items-center gap-3 md:min-w-[240px]">
                    <div className="text-[#13132E]">
                      {detail.icon}
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

                {/* Divider - not after last item */}
                {index < courseDetails.length - 1 && (
                  <div className="w-full h-px bg-[#13132E] opacity-10 my-6" />
                )}
              </div>
            ))}
          </div>

          {/* Apply Now Button Section */}
          <div className="w-full flex justify-start md:justify-center px-6 md:px-8 pt-2 self-start md:self-center">
            <CTALinkOrButton
              size="medium"
              className="w-auto px-5 py-3 bg-[#2244BB] text-white rounded-md hover:bg-[#1a3399] transition-colors"
              url={applicationUrl}
            >
              Apply now
            </CTALinkOrButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseDetailsSection;
