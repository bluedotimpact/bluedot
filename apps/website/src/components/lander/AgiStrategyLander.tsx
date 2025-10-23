import Head from 'next/head';
import {
  addQueryParam,
  useLatestUtmParams,
} from '@bluedot/ui';
import { PiBriefcase, PiCompass, PiFlask } from 'react-icons/pi';

import CommunityMembersSubSection, { CommunityMember } from './agi-strategy/CommunityMembersSubSection';
import GraduateSection from './agi-strategy/GraduateSection';
import PartnerSection from './agi-strategy/PartnerSection';
import CourseBenefitsSection from './agi-strategy/CourseBenefitsSection';
import WhoIsThisForSection from './agi-strategy/WhoIsThisForSection';
import HeroSection from './agi-strategy/HeroSection';
import QuoteSection from './agi-strategy/QuoteSection';
import CourseInformationSection from './agi-strategy/CourseInformationSection';
import CourseCurriculumSection from './agi-strategy/CourseCurriculumSection';
import FAQSection from './agi-strategy/FAQSection';
import AgiStrategyBanner from './agi-strategy/AgiStrategyBanner';

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

  // ============================================================================
  // HERO SECTION CONTENT
  // ============================================================================
  const heroContent = {
    categoryLabel: "AGI STRATEGY",
    title: "Start building the defences that protect humanity",
    description: "Envision a good future. Map the threats from AI. Design effective interventions. Get funded to start shipping. All in 30 hours.",
    primaryCta: {
      text: 'Apply now',
      url: applicationUrlWithUtm,
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: '/courses/agi-strategy/1',
    },
    imageSrc: "/images/agi-strategy/hero-banner-split.png",
    imageAlt: "AGI Strategy visualization",
  };

  // ============================================================================
  // TARGET AUDIENCE CONTENT
  // ============================================================================
  const whoIsThisForContent = {
    title: "Who this course is for",
    targetAudiences: [
      {
        icon: PiBriefcase,
        boldText: 'For entrepreneurs and operators',
        description: 'who want to build solutions that protect humanity.',
      },
      {
        icon: PiCompass,
        boldText: 'For leaders',
        description: 'who want to steer AI\'s trajectory towards beneficial outcomes for humanity.',
      },
      {
        icon: PiFlask,
        boldText: 'For researchers',
        description: 'who want to take big bets on the most impactful research ideas.',
      },
    ],
  };

  // ============================================================================
  // BANNER CONTENT
  // ============================================================================
  const bannerContent = {
    title: "Start building towards a good future today",
    ctaText: "Apply now",
    ctaUrl: applicationUrlWithUtm,
  };

  return (
    <div className="bg-white">
      <Head>
        <title>AGI Strategy Course | BlueDot Impact</title>
        <meta name="description" content="Develop strategic thinking skills for AGI governance and long-term AI strategy. Join our intensive course for strategists shaping the future of artificial general intelligence." />
      </Head>

      <HeroSection
        categoryLabel={heroContent.categoryLabel}
        title={heroContent.title}
        description={heroContent.description}
        primaryCta={heroContent.primaryCta}
        secondaryCta={heroContent.secondaryCta}
        imageSrc={heroContent.imageSrc}
        imageAlt={heroContent.imageAlt}
      />

      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />

      {/* Graduate section */}
      <GraduateSection />

      {/* Who is this course for section */}
      <WhoIsThisForSection 
        title={whoIsThisForContent.title}
        targetAudiences={whoIsThisForContent.targetAudiences}
      />

      {/* Course Curriculum Section */}
      <CourseCurriculumSection />

      {/* Course Benefits Section */}
      <CourseBenefitsSection />

      {/* Course Information Section */}
      <CourseInformationSection />

      {/* Quote Section - What global leaders say about AGI */}
      <QuoteSection />

      {/* Community Members Section - What learners are saying */}
      <CommunityMembersSubSection members={communityMembers} />

      {/* Partner Module */}
      <PartnerSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Banner */}
      <section className="w-full bg-white pt-0 pb-12 min-[680px]:pb-16 lg:pb-20">
        <div className="max-w-max-width mx-auto px-5 min-[680px]:px-8 lg:px-spacing-x">
          <AgiStrategyBanner
            title={bannerContent.title}
            ctaText={bannerContent.ctaText}
            ctaUrl={bannerContent.ctaUrl}
          />
        </div>
      </section>

    </div>
  );
};

export default AgiStrategyLander;
