import Head from 'next/head';
import {
  addQueryParam,
  CTALinkOrButton,
  useLatestUtmParams,
} from '@bluedot/ui';

import { H3 } from '../Text';
import CommunityMembersSubSection, { CommunityMember } from './agi-strategy/CommunityMembersSubSection';
import GraduateSection from './agi-strategy/GraduateSection';
import PartnerSection from './agi-strategy/PartnerSection';
import WhyTakeThisCourseSection from './agi-strategy/WhyTakeThisCourseSection';
import WhoIsThisForSection from './agi-strategy/WhoIsThisForSection';
import HeroSection from './agi-strategy/HeroSection';
import QuoteSection from './agi-strategy/QuoteSection';
import CourseDetailsSection from './agi-strategy/CourseDetailsSection';
import CourseCurriculumSection from './agi-strategy/CourseCurriculumSection';
import FAQSection from './agi-strategy/FAQSection';

const AgiStrategyBanner = ({ title, ctaUrl }: { title: string, ctaUrl: string }) => {
  return (
    <div className="relative w-full mx-auto overflow-hidden rounded-xl bg-[#13132E] bg-[url('/images/agi-strategy/hero-banner-split.png')] bg-cover bg-center xl:max-w-[1118px]">
      {/* Noise layer */}
      <div className="absolute inset-0 pointer-events-none bg-[url('/images/agi-strategy/noise.png')] bg-contain bg-repeat mix-blend-soft-light" />

      <div className="relative flex flex-col items-center justify-center px-14 py-16 gap-8 text-center">
        <img src="/images/agi-strategy/bluedot-icon.svg" alt="BlueDot" className="w-8 h-[30px]" />

        <H3 className="max-w-[238px] min-[680px]:max-w-[496px] text-[20px] min-[680px]:text-[36px] font-semibold text-white">
          {title}
        </H3>

        <CTALinkOrButton
          variant="ghost"
          className="text-[16px] font-medium leading-[24px] px-5 py-3 h-12 bg-white text-[#13132E] rounded-md hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-bluedot-normal"
          url={ctaUrl}
        >
          Apply now
        </CTALinkOrButton>
      </div>
    </div>
  );
};

const applicationUrl = 'https://web.miniextensions.com/9Kuya4AzFGWgayC3gQaX';

const communityMembers: CommunityMember[] = [
  {
    name: 'Neel Nanda',
    jobTitle: 'Mech Interp Lead at Google DeepMind',
    course: 'Former participant and facilitator',
    imageSrc: '/images/graduates/neel.jpeg',
    url: 'https://www.neelnanda.io/about',
  },
  {
    name: 'Marius Hobbhahn',
    jobTitle: 'CEO at Apollo Research',
    course: 'AI Alignment Course Graduate',
    imageSrc: '/images/graduates/marius.jpeg',
    url: 'https://www.mariushobbhahn.com/aboutme/',
  },
  {
    name: 'Chiara Gerosa',
    jobTitle: 'Executive Director at Talos',
    course: 'AI Governance Course Facilitator',
    imageSrc: '/images/graduates/chiara.jpeg',
    url: 'https://www.linkedin.com/in/chiaragerosa/',
  },
  {
    name: 'Richard Ngo',
    jobTitle: 'Former OpenAI and DeepMind',
    course: 'AI Alignment Course Designer',
    imageSrc: '/images/graduates/richard.jpg',
    url: 'https://www.richardcngo.com/',
  },
  {
    name: 'Adam Jones',
    jobTitle: 'Member of Technical Staff at Anthropic',
    course: 'Former AI safety lead at BlueDot',
    imageSrc: '/images/graduates/adam.jpg',
    url: 'https://adamjones.me/',
  },
  {
    name: 'Catherine Fist',
    jobTitle: 'Head of Delivery at UK AISI',
    course: 'AI Governance Course Graduate',
    imageSrc: '/images/graduates/catherine.jpeg',
    url: 'https://www.linkedin.com/in/catherine-fist/',
  },
];

const AgiStrategyLander = () => {
  const { latestUtmParams } = useLatestUtmParams();
  const applicationUrlWithUtm = latestUtmParams.utm_source ? addQueryParam(applicationUrl, 'prefill_Source', latestUtmParams.utm_source) : applicationUrl;

  return (
    <div className="bg-white">
      <Head>
        <title>AGI Strategy Course | BlueDot Impact</title>
        <meta name="description" content="Develop strategic thinking skills for AGI governance and long-term AI strategy. Join our intensive course for strategists shaping the future of artificial general intelligence." />
      </Head>

      <HeroSection
        categoryLabel="AGI STRATEGY"
        title="Start building the defences that protect humanity"
        description="Envision a good future. Map the threats from AI. Design effective interventions. Get funded to start shipping. All in 30 hours."
        primaryCta={{
          text: 'Apply now',
          url: applicationUrlWithUtm,
        }}
        secondaryCta={{
          text: 'Browse curriculum',
          url: '/courses/agi-strategy/1',
        }}
        visualComponent={(
          <img
            src="/images/agi-strategy/hero-banner-split.png"
            alt="AGI Strategy visualization"
            className="size-full object-cover"
          />
        )}
      />

      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />

      {/* Graduate section */}
      <GraduateSection />

      {/* Who is this course for section */}
      <WhoIsThisForSection />

      {/* Course Curriculum Section */}
      <CourseCurriculumSection />

      {/* Why take this course section */}
      <WhyTakeThisCourseSection />

      {/* Course Details Section */}
      <CourseDetailsSection />

      {/* Quote Section - What global leaders say about AGI */}
      <QuoteSection />

      {/* Community Members Section - What learners are saying */}
      <CommunityMembersSubSection members={communityMembers} />

      {/* Partner Module */}
      <PartnerSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Banner */}
      <section className="w-full bg-white pt-0 pb-12 md:pb-16 lg:pb-20">
        <div className="max-w-max-width mx-auto px-4 min-[680px]:px-8 lg:px-spacing-x">
          <AgiStrategyBanner
            title="Start building towards a good future today"
            ctaUrl={applicationUrlWithUtm}
          />
        </div>
      </section>

    </div>
  );
};

export default AgiStrategyLander;
