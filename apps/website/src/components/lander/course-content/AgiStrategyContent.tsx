import {
  PiBriefcase,
  PiCompass,
  PiFlask,
  PiClockClockwise,
  PiChats,
  PiHandHeart,
  PiCalendarDots,
  PiRocketLaunch,
  PiUsersThree,
  PiHandCoins,
} from 'react-icons/pi';
import { CourseLanderContent } from '../CourseLander';

export const AGI_STRATEGY_APPLICATION_URL = 'https://web.miniextensions.com/9Kuya4AzFGWgayC3gQaX';

const AGI_STRATEGY_COLORS = {
  /* Gradient layers:
     1. Left-side darkness - horizontal gradient to darken left edge for text readability
     2. Main colorful gradient - pink→purple→dark blue from bottom-right
     3. Base color - dark navy */
  gradient: 'linear-gradient(to right, rgba(10, 8, 36, 0.9) 0%, rgba(10, 8, 36, 0.4) 5%, rgba(10, 8, 36, 0.15) 15%, rgba(10, 8, 36, 0.05) 30%, transparent 45%), radial-gradient(115% 175% at 95% 135%, rgba(255, 194, 195, 0.65) 0%, rgba(255, 194, 195, 0.50) 25%, rgba(53, 42, 106, 0.65) 60%, rgba(10, 8, 36, 0.60) 100%), #181D3F',
  accent: '#BCA9FF',
  iconBackground: '#2C3F81',
};

export const createAgiStrategyContent = (
  applicationUrlWithUtm: string,
  courseSlug: string,
): CourseLanderContent => ({
  meta: {
    title: 'AGI Strategy Course | BlueDot Impact',
    description: 'Develop strategic thinking skills for AGI governance and long-term AI strategy. Join our intensive course for strategists shaping the future of artificial general intelligence.',
  },

  hero: {
    gradient: AGI_STRATEGY_COLORS.gradient,
    accentColor: AGI_STRATEGY_COLORS.accent,
    categoryLabel: 'COHORT-BASED COURSE',
    title: 'AGI Strategy',
    description: 'Start building the defences that protect humanity: Envision a good future. Map the threats from AI. Design effective interventions. Get funded to start shipping. All in 30 hours.',
    primaryCta: {
      text: 'Apply now',
      url: applicationUrlWithUtm,
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: `/courses/${courseSlug}/1/1`,
    },
    imageSrc: '/images/lander/agi-strategy/hero-graphic.png',
    imageAlt: 'AGI Strategy visualization',
    imageAspectRatio: '1408/1122',
  },

  whoIsThisFor: {
    iconBackgroundColor: AGI_STRATEGY_COLORS.iconBackground,
    title: 'Who this course is for',
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
    bottomCta: {
      boldText: "Don't fit these perfectly? Apply anyway.",
      text: 'Some of our most impactful participants have included teachers, policymakers, engineers, and community leaders. We bet on drive and ambition, not CVs.',
      buttonText: 'Apply now',
      buttonUrl: applicationUrlWithUtm,
    },
  },

  curriculum: {
    title: 'Curriculum Overview',
    courseSlug,
  },

  courseBenefits: {
    title: 'How this course will benefit you',
    benefits: [
      {
        icon: PiRocketLaunch,
        title: 'Take action in less than 30 hours',
        description: "You don't need another degree. This AGI Strategy course replaces years of self-study with three frameworks: incentive mapping to understand the AGI race, kill chains to analyse AI threats, and defence-in-depth to design interventions that counter them. You'll finish with a fundable plan.",
      },
      {
        icon: PiUsersThree,
        title: 'Join a network of builders',
        description: "This course isn't for everyone. We're building a community of people who are energised to take ambitious actions to make AI go well, including starting new companies, policy entrepreneurship, and high-impact research bets. Completing this course will give you access to this community.",
      },
      {
        icon: PiHandCoins,
        title: 'Get funded to accelerate your impact',
        description: "If your final course proposal is strong, you'll receive $10-50k to kickstart your transition into impactful work, and you'll be invited to co-work with us in London for 1-2 weeks. We'll do whatever it takes to accelerate your journey.",
      },
    ],
  },

  courseInformation: {
    title: 'Course information',
    applicationUrl: applicationUrlWithUtm,
    scheduleCtaText: 'Apply now',
    courseSlug,
    details: [
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
        scheduleDescription: 'Check above for upcoming rounds and application deadlines.',
      },
    ],
  },

  quotes: {
    quotes: [
      {
        quote: '"We should not underestimate the real threats coming from AI [while] we have a narrowing window of opportunity to guide this technology responsibly."',
        name: 'Ursula von der Leyen',
        role: 'President, European Commission',
        imageSrc: '/images/agi-strategy/ursula.webp',
        url: 'https://neighbourhood-enlargement.ec.europa.eu/news/2023-state-union-address-president-von-der-leyen-2023-09-13_en',
      },
      {
        quote: '"I\'ve always thought of AI as the most profound technology humanity is working on. More profound than fire or electricity or anything that we\'ve done in the past… The downside is, at some point, that humanity loses control of the technology it\'s developing."',
        name: 'Sundar Pichai',
        role: 'CEO, Google',
        imageSrc: '/images/agi-strategy/sundar.webp',
        url: 'https://garrisonlovely.substack.com/p/a-compilation-of-tech-executives',
      },
      {
        quote: '"AI could surpass almost all humans at almost everything shortly after 2027."',
        name: 'Dario Amodei',
        role: 'CEO, Anthropic',
        imageSrc: '/images/lander/foai/dario.webp',
        url: 'https://arstechnica.com/ai/2025/01/anthropic-chief-says-ai-could-surpass-almost-all-humans-at-almost-everything-shortly-after-2027/',
      },
      {
        quote: '"I\'m all in favor of accelerating technological progress, but there is something unsettling about the way OpenAI explicitly declares its mission to be the creation of AGI. AI is a wonderful tool for the betterment of humanity; AGI is a potential successor species … To the extent the mission produces extra motivation for the team to ship good products, it\'s a positive. To the extent it might actually succeed, it\'s a reason for concern."',
        name: 'David Sacks',
        role: 'White House AI and Crypto Czar',
        imageSrc: '/images/agi-strategy/david-sacks.webp',
        url: 'https://x.com/HumanHarlan/status/1864858286065111298',
      },
    ],
  },

  communityMembers: [
    {
      name: 'Neel Nanda',
      jobTitle: 'Mech Interp Lead at Google DeepMind',
      course: 'Former participant and facilitator',
      imageSrc: '/images/graduates/neel.webp',
      url: 'https://www.neelnanda.io/about',
    },
    {
      name: 'Marius Hobbhahn',
      jobTitle: 'CEO at Apollo Research',
      course: 'AI Alignment Course Graduate',
      imageSrc: '/images/graduates/marius.webp',
      url: 'https://www.mariushobbhahn.com/aboutme/',
    },
    {
      name: 'Chiara Gerosa',
      jobTitle: 'Executive Director at Talos',
      course: 'AI Governance Course Facilitator',
      imageSrc: '/images/graduates/chiara.webp',
      url: 'https://www.linkedin.com/in/chiaragerosa/',
    },
    {
      name: 'Richard Ngo',
      jobTitle: 'Former OpenAI and DeepMind',
      course: 'AI Alignment Course Designer',
      imageSrc: '/images/graduates/richard.webp',
      url: 'https://www.richardcngo.com/',
    },
    {
      name: 'Adam Jones',
      jobTitle: 'Member of Technical Staff at Anthropic',
      course: 'Former AI safety lead at BlueDot',
      imageSrc: '/images/graduates/adam.webp',
      url: 'https://adamjones.me/',
    },
    {
      name: 'Catherine Fist',
      jobTitle: 'Head of Delivery at UK AISI',
      course: 'AI Governance Course Graduate',
      imageSrc: '/images/graduates/catherine.webp',
      url: 'https://www.linkedin.com/in/catherine-fist/',
    },
  ],

  partners: {
    title: 'Co-created with our network of leading AI industry partners',
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
  },

  faq: {
    title: 'Frequently Asked Questions',
    items: [
      {
        id: 'funding',
        question: 'Can I just apply for funding?',
        answer: 'Funding is only available for graduates of the course.',
      },
      {
        id: 'bluedot',
        question: 'Who is BlueDot Impact?',
        answer: (
          <>
            We're a London-based startup. Since 2022, we've trained 5,000 people, with ~1,000 now working on making AI go well.
            <br /><br />
            Our courses are the main entry point into the AI safety field.
            <br /><br />
            We're an intense 4-person team. We've raised $35M in total, including $25M in 2025.
          </>
        ),
      },
    ],
  },

  banner: {
    title: 'Start building towards a good future today',
    ctaText: 'Apply now',
    ctaUrl: applicationUrlWithUtm,
    imageSrc: '/images/lander/agi-strategy/hero-banner-split.webp',
    imageAlt: 'AGI Strategy banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.webp',
  },
});
