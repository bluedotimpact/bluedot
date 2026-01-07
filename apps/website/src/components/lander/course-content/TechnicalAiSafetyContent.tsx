import {
  PiBriefcase,
  PiFlask,
  PiClockClockwise,
  PiChats,
  PiHandHeart,
  PiCalendarDots,
  PiRocketLaunch,
  PiUsersThree,
  PiCode,
  PiChalkboardTeacherLight,
} from 'react-icons/pi';
import { CourseLanderContent } from '../CourseLander';

export const TECHNICAL_AI_SAFETY_APPLICATION_URL = 'https://web.miniextensions.com/9YX1i46qewCv5m17v8rl';

const TAS_COLORS = {
  /* Gradient layers:
     1. Left-side darkness - horizontal gradient to darken left edge for text readability
     2. Bottom-right warm glow - peach → purple → dark purple (from Figma)
     3. Base color - deep purple/magenta */
  gradient: 'linear-gradient(to right, rgba(20, 8, 25, 0.6) 0%, rgba(20, 8, 25, 0.4) 20%, rgba(20, 8, 25, 0.2) 40%, transparent 55%), radial-gradient(130% 160% at 100% 108.81%, rgba(255, 202, 171, 0.40) 0%, rgba(126, 85, 144, 0.40) 52.4%, rgba(46, 16, 54, 0.40) 100%), #2E1036',
  accent: '#E0A5F9',
  iconBackground: 'hsla(284, 46%, 30%, 1)',
  bright: '#ffe9ff',
  mid: '#b880d1',
  full: '#a060bb',
};

export const createTechnicalAiSafetyContent = (
  applicationUrlWithUtm: string,
  courseSlug: string,
): CourseLanderContent => ({
  meta: {
    title: 'Technical AI Safety Course | BlueDot Impact',
    description: 'Start building safer AI. Join our intensive course for builders shaping the future of artificial general intelligence.',
  },

  hero: {
    gradient: TAS_COLORS.gradient,
    accentColor: TAS_COLORS.accent,
    categoryLabel: 'COHORT-BASED COURSE',
    title: 'Technical AI Safety',
    description: 'Understand current safety techniques. Map the gaps. Identify where you can contribute. All in 30 hours.',
    primaryCta: {
      text: 'Apply now',
      url: applicationUrlWithUtm,
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: `/courses/${courseSlug}/1/1`,
    },
    imageSrc: '/images/lander/technical-ai-safety/hero-graphic.png',
    imageAlt: 'Technical AI Safety visualization',
    imageAspectRatio: '1408/1122',
  },

  whoIsThisFor: {
    iconBackgroundColor: TAS_COLORS.iconBackground,
    title: 'Who this course is for',
    targetAudiences: [
      {
        icon: PiFlask,
        boldText: 'For ML researchers',
        description: 'who want to take big bets on the most impactful research ideas.',
      },
      {
        icon: PiCode,
        boldText: 'For software engineers',
        description: 'who want to scale AI safety research.',
      },
      {
        icon: PiBriefcase,
        boldText: 'For policy professionals',
        description: 'who need deep technical understanding to build governance solutions.',
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
    iconBackgroundColor: TAS_COLORS.bright,
    benefits: [
      {
        icon: PiRocketLaunch,
        title: 'Take action in less than 30 hours',
        description: "Skip months of scattered reading. This Technical AI Safety course gives you a structured overview of key safety techniques. Understand what works, what fails, and where the gaps are. You'll finish with a plan for contributing.",
      },
      {
        icon: PiUsersThree,
        title: 'Join a network of builders',
        description: "This course isn't for everyone. We're building a community of people who are energised to take ambitious actions to make AI go well, including starting new companies, policy entrepreneurship, and high-impact research bets. Completing this course will give you access to this community.",
      },
      {
        icon: PiChalkboardTeacherLight,
        title: 'Learn with experts',
        description: "Every discussion is facilitated by an AI safety expert who can answer your technical questions, challenge your assumptions, and connect concepts to real work happening. They'll help connect you to concrete pathways for contribution.",
      },
    ],
  },

  courseInformation: {
    title: 'Course information',
    applicationUrl: applicationUrlWithUtm,
    scheduleCtaText: 'Apply now',
    courseSlug,
    accentColor: TAS_COLORS.full,
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
      name: 'Juan Felipe Ceron Uribe',
      jobTitle: 'AI Alignment Research Engineer at OpenAI',
      course: 'Former participant and facilitator',
      imageSrc: '/images/graduates/juan-felipe.webp',
      url: 'https://www.linkedin.com/in/juan-felipe-ceron-uribe/',
    },
    {
      name: 'Nikita Ostrovsky',
      jobTitle: 'AI Reporter at TIME',
      course: 'AI Alignment Course Graduate',
      imageSrc: '/images/graduates/nikita.webp',
      url: 'https://www.linkedin.com/in/nikostro/',
    },
    {
      name: 'Ana Carvalho',
      jobTitle: 'Contributor to AI Safety Engineering Taskforce',
      course: 'AI Alignment Course Graduate',
      imageSrc: '/images/graduates/ana.webp',
      url: 'https://www.linkedin.com/in/anapmc/',
    },
    {
      name: 'Sabrina Shih',
      jobTitle: 'AI Policy Manager at Responsible AI Institute',
      course: 'AI Alignment Course Graduate',
      imageSrc: '/images/graduates/sabrina.webp',
      url: 'https://www.linkedin.com/in/sabrinajadeshih/',
    },
    {
      name: 'Cameron Holmes',
      jobTitle: 'Senior Research Manager at MATS',
      course: 'AI Alignment Course Graduate',
      imageSrc: '/images/graduates/cameron.webp',
      url: 'https://www.linkedin.com/in/cameronholmes1/',
    },
  ],

  faq: {
    title: 'Frequently Asked Questions',
    items: [
      {
        id: 'technical',
        question: 'How much technical background do I need?',
        answer: (
          <>
            You should understand the basics of how LLMs are trained/fine-tuned, that AI development is driven by data, algorithms and compute, and that the reward function for neural networks is optimised through gradient descent.
            <br /> <br />
            Our 2-hour, self-paced <a href="https://bluedot-impact.notion.site/AI-Foundations-293f8e69035380f29863c4c92c41fac7" target="_blank" rel="noopener noreferrer" className="underline">AI Foundations course</a> will give you enough background.
          </>
        ),
      },
      {
        id: 'agi-strategy',
        question: 'Do I need to take the AGI strategy course first?',
        answer: (
          <>
            It's not required, but strongly recommended. The AGI Strategy course provides essential context that this course builds on. While you can start here directly, you'll get more value if you understand how technical safety fits into the broader landscape of making AI go well.
          </>
        ),
      },
      {
        id: 'bluedot',
        question: 'Who is BlueDot Impact?',
        answer: (
          <>
            We're a London-based startup. Since 2022, we've trained 7,000+ people, with 100s now working on making AI go well.
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
    imageAlt: 'Technical AI Safety banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.webp',
  },
});
