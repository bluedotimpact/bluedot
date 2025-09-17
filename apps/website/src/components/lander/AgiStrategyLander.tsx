import Head from 'next/head';
import {
  CTALinkOrButton,
  Section,
} from '@bluedot/ui';

import { H2, H3 } from '../Text';
import CommunityMembersSubSection, { CommunityMember } from './agi-strategy/CommunityMembersSubSection';
import GraduateSection from './agi-strategy/GraduateSection';
import WhyTakeThisCourseSection from './agi-strategy/WhyTakeThisCourseSection';
import HeroSection from './agi-strategy/HeroSection';
import QuoteSection from './agi-strategy/QuoteSection';
import CourseDetailsSection from './agi-strategy/CourseDetailsSection';
import FAQSection from './agi-strategy/FAQSection';

const AgiStrategyBanner = ({ title, ctaUrl }: { title: string, ctaUrl: string }) => {
  return (
    <div className="agi-strategy-lander__banner flex flex-col items-center justify-center w-full py-16 px-12 gap-8 text-center bg-gradient-to-b from-white to-[#ECF0FF] -mt-px">
      <H3 className="agi-strategy-lander__banner-title max-w-[480px] font-semibold text-size-lg leading-tight text-[#13132E]">
        {title}
      </H3>
      <CTALinkOrButton
        size="small"
        className="agi-strategy-lander__banner-cta w-auto h-11 px-5 py-3 text-[14px] font-medium rounded-md bg-[#2244BB] text-white hover:bg-[#1a3399] focus:bg-[#1a3399] transition-colors duration-200 lg:h-[3.125rem] lg:text-[16px]"
        url={ctaUrl}
      >
        Apply now
      </CTALinkOrButton>
    </div>
  );
};

const applicationUrl = 'https://web.miniextensions.com/9Kuya4AzFGWgayC3gQaX?utm_source=website_lander';

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
  return (
    <div className="bg-white">
      <Head>
        <title>AGI Strategy Course | BlueDot Impact</title>
        <meta name="description" content="Develop strategic thinking skills for AGI governance and long-term AI strategy. Join our intensive course for strategists shaping the future of artificial general intelligence." />
      </Head>

      <HeroSection
        title="Start building the defences that protect humanity"
        description="Envision a good future. Map the threats from AI. Design effective interventions. Get funded to start shipping. All in 30 hours."
        primaryCta={{
          text: 'Apply now',
          url: applicationUrl,
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

      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />

      {/* Why take this course section */}
      <WhyTakeThisCourseSection />

      {/* Course Details Section */}
      <CourseDetailsSection />

      {/* Quote Section - What global leaders say about AGI */}
      <QuoteSection />

      {/* Community Members Section - What learners are saying */}
      <Section className="py-16 bg-[#FAFAF7]">
        <H2 className="text-[36px] text-center font-semibold leading-tight mb-16">Some of our graduates</H2>
        <CommunityMembersSubSection members={communityMembers} />
      </Section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Banner */}
      <AgiStrategyBanner
        title="Don't wait until the world's even more crazy. Start making an impact today."
        ctaUrl={applicationUrl}
      />

    </div>
  );
};

export default AgiStrategyLander;
