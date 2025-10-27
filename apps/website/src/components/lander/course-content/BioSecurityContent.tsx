import {
  PiBriefcase,
  PiCompass,
  PiFlask,
  PiGraduationCap,
  PiClockClockwise,
  PiChats,
  PiHandHeart,
  PiCalendarDots,
  PiRocketLaunch,
  PiUsersThree,
  PiHandCoins,
} from 'react-icons/pi';
import { CourseLanderContent } from '../CourseLander';

export const BIOSECURITY_APPLICATION_URL = 'https://web.miniextensions.com/aHs5xwcmFOE2nbMf0zaY';

export const createBioSecurityContent = (
  applicationUrlWithUtm: string,
  courseSlug: string,
): CourseLanderContent => ({
  meta: {
    title: 'Biosecurity Course | BlueDot Impact',
    description: 'Understand current efforts to prevent, detect and respond to pandemic threats. Identify where you can contribute. Get funded to start building. All in 30 hours.',
  },

  hero: {
    categoryLabel: 'BIOSECURITY',
    title: 'Start building towards a pandemic-proof world',
    description: 'Understand current efforts to prevent, detect and respond to pandemic threats. Identify where you can contribute. Get funded to start building. All in 30 hours.',
    primaryCta: {
      text: 'Apply now',
      url: applicationUrlWithUtm,
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: `/courses/${courseSlug}/1`,
    },
    imageSrc: '/images/agi-strategy/hero-banner-split.png',
    imageAlt: 'Biosecurity visualization',
  },

  whoIsThisFor: {
    title: 'Who this course is for',
    targetAudiences: [
      {
        icon: PiFlask,
        boldText: 'For engineers and bioscientists',
        description: 'who want to defend against pandemics.',
      },
      {
        icon: PiCompass,
        boldText: 'For policy professionals',
        description: 'who want to contribute to biosecurity policy.',
      },
      {
        icon: PiBriefcase,
        boldText: 'For entrepreneurs',
        description: 'who want to build new pandemic defences.',
      },
    ],
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
        description: 'Skip months of scattered reading. This biosecurity course gives you a structured overview of efforts to prevent, detect and respond to pandemics. Understand what works, what fails, and where the gaps are.',
      },
      {
        icon: PiUsersThree,
        title: 'Join a network of builders',
        description: 'This course isn\'t for everyone. We\'re building a community of people who are energised to take ambitious actions to build a pandemic-proof world, including starting new companies, policy entrepreneurship, and high-impact research bets. Completing this course will give you access to this community.',
      },
      {
        icon: PiHandCoins,
        title: 'Get funded to accelerate your impact',
        description: 'If your final course proposal is strong, you\'ll receive $10-50k to kickstart your transition into impactful work, and you\'ll be invited to co-work with us in London for 1-2 weeks. We\'ll do whatever it takes to accelerate your journey.',
      },
    ],
  },

  courseInformation: {
    title: 'Course information',
    applicationUrl: applicationUrlWithUtm,
    scheduleCtaText: 'Apply now',
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
        description: 'All discussions will be facilitated by a biosecurity expert.',
      },
      {
        icon: PiHandHeart,
        label: 'Price',
        description: 'This course is freely available and operates on a \'pay-what-you-want\' model.',
      },
      {
        icon: PiCalendarDots,
        label: 'Schedule',
        description: null,
        isSchedule: true,
        scheduleDescription: (
          <>
            Intensive round starts <span className="font-semibold">3 Nov</span>, application deadline <span className="font-semibold">30 Oct</span>
            <br />
            Part-time round starts <span className="font-semibold">17 Nov</span>, application deadline <span className="font-semibold">9 Nov</span>
          </>
        ),
      },
    ],
  },

  quotes: {
    quotes: [],
  },

  communityMembers: [],

  faq: {
    title: 'Frequently Asked Questions',
    items: [
      {
        id: 'biology-expertise',
        question: 'How much biology expertise do I need?',
        answer: 'None! We will help you understand the basics.',
      },
    ],
  },

  banner: {
    title: 'Start building a pandemic-proof world today',
    ctaText: 'Apply now',
    ctaUrl: applicationUrlWithUtm,
    imageSrc: '/images/agi-strategy/hero-banner-split.png',
    imageAlt: 'Biosecurity banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.png',
  },
});
