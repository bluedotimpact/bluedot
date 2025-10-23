import Head from 'next/head';
import {
  addQueryParam,
  useLatestUtmParams,
} from '@bluedot/ui';
import {
  PiBriefcase,
  PiCompass,
  PiFlask,
  PiGraduationCap,
  PiClockClockwise,
  PiChats,
  PiHandHeart,
  PiCalendarDots,
} from 'react-icons/pi';

import CommunityMembersSubSection, { CommunityMember } from './agi-strategy/CommunityMembersSubSection';
import GraduateSection from './agi-strategy/GraduateSection';
import PartnerSection, { Partner } from './agi-strategy/PartnerSection';
import CourseBenefitsSection from './agi-strategy/CourseBenefitsSection';
import WhoIsThisForSection from './agi-strategy/WhoIsThisForSection';
import HeroSection from './agi-strategy/HeroSection';
import QuoteSection, { QuoteWithUrl } from './agi-strategy/QuoteSection';
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
  // COURSE CURRICULUM CONTENT
  // ============================================================================
  const curriculumContent = {
    title: "Curriculum Overview",
    /** API endpoint slug - must match the course slug in the database */
    courseSlug: "agi-strategy",
  };

  // ============================================================================
  // COURSE INFORMATION CONTENT
  // ============================================================================
  const courseInformationContent = {
    title: "Course information",
    applicationUrl: applicationUrlWithUtm,
    scheduleCtaText: "Apply now",
    details: [
      {
        icon: PiGraduationCap,
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
        icon: PiClockClockwise,
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
        icon: PiChats,
        label: 'Facilitator',
        description: 'All discussions will be facilitated by an AI safety expert.',
      },
      {
        icon: PiHandHeart,
        label: 'Price',
        description: 'This course is freely available and operates on a "pay-what-you-want" model.',
      },
      {
        icon: PiCalendarDots,
        label: 'Schedule',
        description: null,
        isSchedule: true,
        scheduleDescription: (
          <>
            New cohorts start every month:
            <br />
            Next round <span className="font-semibold">27th Oct</span>, application deadline <span className="font-semibold">19th Oct</span>
          </>
        ),
      },
    ],
  };

  // ============================================================================
  // QUOTES CONTENT
  // ============================================================================
  const quotesContent: { quotes: QuoteWithUrl[] } = {
    quotes: [
      {
        quote: '"We should not underestimate the real threats coming from AI [while] we have a narrowing window of opportunity to guide this technology responsibly."',
        name: 'Ursula von der Leyen',
        role: 'President, European Commission',
        imageSrc: '/images/agi-strategy/ursula.png',
        url: 'https://neighbourhood-enlargement.ec.europa.eu/news/2023-state-union-address-president-von-der-leyen-2023-09-13_en',
      },
      {
        quote: '"I\'ve always thought of AI as the most profound technology humanity is working on. More profound than fire or electricity or anything that we\'ve done in the past… The downside is, at some point, that humanity loses control of the technology it\'s developing."',
        name: 'Sundar Pichai',
        role: 'CEO, Google',
        imageSrc: '/images/agi-strategy/sundar.jpg',
        url: 'https://garrisonlovely.substack.com/p/a-compilation-of-tech-executives',
      },
      {
        quote: '"AI could surpass almost all humans at almost everything shortly after 2027."',
        name: 'Dario Amodei',
        role: 'CEO, Anthropic',
        imageSrc: '/images/lander/foai/dario.jpeg',
        url: 'https://arstechnica.com/ai/2025/01/anthropic-chief-says-ai-could-surpass-almost-all-humans-at-almost-everything-shortly-after-2027/',
      },
      {
        quote: '"I\'m all in favor of accelerating technological progress, but there is something unsettling about the way OpenAI explicitly declares its mission to be the creation of AGI. AI is a wonderful tool for the betterment of humanity; AGI is a potential successor species … To the extent the mission produces extra motivation for the team to ship good products, it\'s a positive. To the extent it might actually succeed, it\'s a reason for concern."',
        name: 'David Sacks',
        role: 'White House AI and Crypto Czar',
        imageSrc: '/images/agi-strategy/david-sacks.jpg',
        url: 'https://x.com/HumanHarlan/status/1864858286065111298',
      },
    ],
  };

  // ============================================================================
  // PARTNERS CONTENT
  // ============================================================================
  const partnersContent: { title: string; partners: Partner[] } = {
    title: "Co-created with our network of leading AI industry partners",
    partners: [
      {
        name: 'Entrepreneur First',
        url: 'https://www.joinef.com/',
        logo: '/images/agi-strategy/ef.svg',
        descriptionShort: (
          <>
            We collaborate with EF to host AI safety and def/acc <a href="https://luma.com/AI-security-hackathon" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity">hackathons</a>.
          </>
        ),
        descriptionFull: (
          <>
            A London-based startup incubation programme. We collaborate with EF to host AI safety and def/acc <a href="https://luma.com/AI-security-hackathon" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity">hackathons</a>. See <a href="https://luma.com/bluedotevents" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity">here</a> for future events.
          </>
        ),
      },
      {
        name: 'Institute for Progress',
        url: 'https://ifp.org/',
        logo: '/images/agi-strategy/ifp.svg',
        descriptionShort: (
          <>
            We collaborate with IFP to get impactful projects from their <a href="https://ifp.org/the-launch-sequence/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity">Launch Sequence</a> off the ground.
          </>
        ),
        descriptionFull: (
          <>
            IFP is a science and innovation think tank. We collaborate with IFP to get impactful projects from their <a href="https://ifp.org/the-launch-sequence/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity">Launch Sequence</a> off the ground.
          </>
        ),
      },
      {
        name: '50 Years',
        url: 'https://www.fiftyyears.com/',
        logo: '/images/agi-strategy/fifty-years.svg',
        descriptionShort: (
          <>
            We fast-track our most promising entrepreneurs into their <a href="https://www.fiftyyears.com/5050/ai" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity">5050 AI cohorts</a>, focused on building an aligned AI future.
          </>
        ),
        descriptionFull: (
          <>
            A pre-seed and seed VC firm. We fast-track our most promising entrepreneurs into their <a href="https://www.fiftyyears.com/5050/ai" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity">5050 AI cohorts</a>, focused on building an aligned AI future.
          </>
        ),
      },
      {
        name: 'Seldon Lab',
        url: 'https://seldonlab.com/',
        logo: '/images/agi-strategy/seldon-lab.svg',
        descriptionShort: (
          <>
            We help our most entrepreneurial community members get ready to join future Seldon batches.
          </>
        ),
        descriptionFull: (
          <>
            Seldon offers guidance and investments in the next generation of AGI security startups. We help our most entrepreneurial community members get ready to join future Seldon batches.
          </>
        ),
      },
      {
        name: 'Halcyon Futures',
        url: 'https://halcyonfutures.org/',
        logo: '/images/agi-strategy/halcyon-futures.svg',
        descriptionShort: (
          <>
            We introduce our most promising leaders to Halcyon.
          </>
        ),
        descriptionFull: (
          <>
            Halcyon identifies leaders from business, policy, and academia, and helps them take on new ambitious projects. We introduce our most promising leaders to Halcyon.
          </>
        ),
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
      <CourseCurriculumSection
        title={curriculumContent.title}
        courseSlug={curriculumContent.courseSlug}
      />

      {/* Course Benefits Section */}
      <CourseBenefitsSection />

      {/* Course Information Section */}
      <CourseInformationSection
        title={courseInformationContent.title}
        applicationUrl={courseInformationContent.applicationUrl}
        details={courseInformationContent.details}
        scheduleCtaText={courseInformationContent.scheduleCtaText}
      />

      {/* Quote Section - What global leaders say about AGI */}
      <QuoteSection quotes={quotesContent.quotes} />

      {/* Community Members Section - What learners are saying */}
      <CommunityMembersSubSection members={communityMembers} />

      {/* Partner Module */}
      <PartnerSection
        title={partnersContent.title}
        partners={partnersContent.partners}
      />

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
