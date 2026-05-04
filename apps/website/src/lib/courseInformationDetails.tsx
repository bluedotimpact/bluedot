/**
 * Source of truth for the per-course "How the course works" / "Course information"
 * block. Consumed by both the lander (`lander/course-content/*Content.tsx`) and
 * the post-completion enrollment CTA (`CourseCompletionSection`).
 */

import {
  PiArrowsLeftRight,
  PiCalendarDots,
  PiCertificate,
  PiChats,
  PiClock,
  PiClockClockwise,
  PiCurrencyDollar,
  PiDesktop,
  PiGraduationCap,
  PiHandHeart,
  PiRocketLaunch,
} from 'react-icons/pi';
import type { CourseDetail } from '../components/lander/components/CourseInformationSection';
export type CourseInformationConfig = {
  title: string;
  scheduleCtaText: string;
  details: CourseDetail[];
};

export const COURSE_INFORMATION_DETAILS: Record<string, CourseInformationConfig> = {
  'agi-strategy': {
    title: 'How the course works',
    scheduleCtaText: 'Apply now',
    details: [
      {
        icon: PiArrowsLeftRight,
        label: 'Options',
        description: 'Intensive (~5 days at ~5h/day) or part-time (~5 weeks at ~5h/week). Same content, different pace.',
      },
      {
        icon: PiClockClockwise,
        label: 'Commitment',
        description: (
          <>
            Each day or week, you will:
            <br />
            <span className="font-semibold">Complete 3 hours</span> of reading and writing, and <span className="font-semibold">join ~8 peers in a 2-hour Zoom meeting</span> to discuss the content.
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
    ],
  },

  'ai-governance': {
    title: 'How it works',
    scheduleCtaText: 'Apply by 10 May',
    details: [
      {
        icon: PiGraduationCap,
        label: 'Prerequisites',
        description: (
          <>
            <a href="/courses/agi-strategy" className="font-medium underline hover:text-bluedot-normal">AGI Strategy course</a>
            {' '}
            (or equivalent), high-level understanding of AI, and bias toward action.
          </>
        ),
      },
      {
        icon: PiGraduationCap,
        label: 'Selection',
        description: '~20-25% acceptance rate. We\'re looking for people who are analytical, motivated, and considering making this their life\'s work. If you\'re here to add a credential, this isn\'t for you.',
      },
      {
        icon: PiClockClockwise,
        label: 'Time',
        description: '~30 hours total. 2-3 hours of readings and exercises per unit; 2 hours of live discussion with a cohort of 6-8, led by a Teaching Fellow working in AI governance.',
      },
      {
        icon: PiHandHeart,
        label: 'Price',
        description: 'Free (pay-what-you-want).',
      },
    ],
  },

  biosecurity: {
    title: 'How the course works',
    scheduleCtaText: 'Apply now',
    details: [
      {
        icon: PiArrowsLeftRight,
        label: 'Options',
        description: 'Intensive (~6 days at ~5h/day) or part-time (~6 weeks at ~5h/week). Same content, different pace.',
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
        description: 'This course is freely available and operates on a "pay-what-you-want" model.',
      },
    ],
  },

  'future-of-ai': {
    title: 'Course information',
    scheduleCtaText: 'Start now',
    details: [
      {
        icon: PiClock,
        label: 'Commitment',
        description: 'Self-paced. Complete the 2-hour course whenever suits you. Interactive content with reflection prompts throughout.',
      },
      {
        icon: PiDesktop,
        label: 'Format',
        description: 'Entirely online. Accessible from any device. Includes videos, interactive demos, and discussion prompts.',
      },
      {
        icon: PiCurrencyDollar,
        label: 'Price',
        description: 'Completely free. No hidden costs.',
      },
      {
        icon: PiCertificate,
        label: 'Certificate',
        description: 'Industry-recognised certificate upon completion showing you\'re informed about AI\'s future.',
      },
      {
        icon: PiRocketLaunch,
        label: 'Start now',
        description: 'Begin immediately. No waiting for cohorts or application approval.',
      },
    ],
  },

  'personal-theory-of-impact': {
    title: 'Project information',
    scheduleCtaText: 'Get started',
    details: [
      {
        icon: PiClockClockwise,
        label: 'Commitment',
        description: (
          <>
            You will spend <b>at least 20 hours</b> over 2 weeks. You will:
            <ul className="list-disc pl-4 mt-1">
              <li>Orient yourself to the existing literature about your chosen area</li>
              <li>Talk to people who are already working on the problem</li>
              <li>Quickly test what it means to contribute in this area</li>
            </ul>
          </>
        ),
      },
      {
        icon: PiChats,
        label: 'Format',
        description: 'This is currently a self-paced project. A guided version with coaching is planned — check back in June 2026.',
      },
      {
        icon: PiHandHeart,
        label: 'Price',
        description: 'This course is freely available.',
      },
    ],
  },

  'technical-ai-safety': {
    title: 'How the course works',
    scheduleCtaText: 'Apply now',
    details: [
      {
        icon: PiArrowsLeftRight,
        label: 'Options',
        description: 'Intensive (~6 days at ~5h/day) or part-time (~6 weeks at ~5h/week). Same content, different pace.',
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
    ],
  },

  'technical-ai-safety-project': {
    title: 'Course information',
    scheduleCtaText: 'Apply now',
    details: [
      {
        icon: PiClockClockwise,
        label: 'Commitment',
        description: (
          <>
            You will spend <b>30 hours</b> working on your project. Each week you will:
            <ul className="list-disc pl-4 mt-1">
              <li>Provide regular updates on your progress</li>
              <li>Join ~8 peers and an AI safety expert in a 1-hour check-in to discuss your progress and get feedback</li>
            </ul>
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
};
