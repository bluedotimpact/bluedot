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
    scheduleCtaText: 'Apply now',
    details: [
      {
        icon: PiGraduationCap,
        label: 'Preparation',
        description: 'No previous BlueDot course is required. Some familiarity with AI capabilities and risks will help. Come ready to read critically, write, and defend and revise your views.',
      },
      {
        icon: PiClockClockwise,
        label: 'Time',
        description: 'Around 40 hours total across six units. Each unit includes 4–5 hours of readings and exercises and a two-hour live discussion with a small cohort, led by a Teaching Fellow working in AI governance.',
      },
      {
        icon: PiHandHeart,
        label: 'Price',
        description: 'Free, with optional contributions.',
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
