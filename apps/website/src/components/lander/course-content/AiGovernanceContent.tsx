import {
  PiBriefcase,
  PiLightbulb,
  PiUsers,
  PiClockClockwise,
  PiChats,
  PiHandHeart,
  PiCalendarDots,
} from 'react-icons/pi';
import { CourseLanderContent } from '../CourseLander';

export const AI_GOVERNANCE_APPLICATION_URL = 'https://web.miniextensions.com/BSUqN3WHmeL9MbzAj2P6';

export const createAiGovernanceContent = (
  applicationUrlWithUtm: string,
  courseSlug: string,
): CourseLanderContent => ({
  meta: {
    title: 'AI Governance Course | BlueDot Impact',
    description: 'Master the frameworks to analyse AI risks, understand regulatory tools, and design effective policy interventions. Join our intensive AI governance course.',
  },

  hero: {
    categoryLabel: 'AI GOVERNANCE',
    title: 'Shape the institutions that will govern the most powerful technology in history',
    description: 'Master the frameworks to analyse AI risks, understand regulatory tools, and design effective policy interventions. In less than 30 hours.',
    primaryCta: {
      text: 'Apply now',
      url: applicationUrlWithUtm,
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: `/courses/${courseSlug}/1/1`,
    },
    imageSrc: '/images/ai-governance/hero-banner-split.png',
    imageAlt: 'AI Governance visualization',
  },

  whoIsThisFor: {
    title: 'Who this course is for',
    targetAudiences: [
      {
        icon: PiBriefcase,
        boldText: 'Policy professionals',
        description: 'transitioning into AI governance from government, think tanks, or law who need to understand the technical landscape and strategic considerations',
      },
      {
        icon: PiLightbulb,
        boldText: 'Technologists pivoting into policy',
        description: 'who understand AI capabilities but need frameworks for institutional design and regulatory strategy',
      },
      {
        icon: PiUsers,
        boldText: 'Researchers and analysts',
        description: 'who want to think through the biggest open questions in how to govern AI and build a credible portfolio of work',
      },
    ],
    bottomCta: {
      boldText: "Don't fit these perfectly? Apply anyway.",
      text: 'Some of our most impactful participants have included teachers, policymakers, engineers, and community leaders. We bet on drive and ambition, not CVs.',
    },
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

  banner: {
    title: 'Steer the future of AI today',
    ctaText: 'Apply now',
    ctaUrl: applicationUrlWithUtm,
    imageSrc: '/images/ai-governance/hero-banner-split.png',
    imageAlt: 'AI Governance banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.webp',
  },
});
