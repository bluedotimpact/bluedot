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
    scheduleCtaText: 'Join the next cohort',
    details: [
      {
        icon: PiGraduationCap,
        label: 'Prerequisites',
        description: (
          <>
            <a href="/courses/agi-strategy" className="font-medium underline hover:text-bluedot-normal">AGI Strategy course</a> (or equivalent background in AI risks)
            <br />
            <span className="font-medium">High-level understanding of AI</span>
            <br />
            <span className="font-medium">High agency</span> - bias toward action, not just learning
            <br />
            <br />
            <span className="text-bluedot-navy/60">We're selective. The course has an acceptance rate of roughly 20-25%.</span>
            <br />
            <span className="text-bluedot-navy/60">We're looking for people who are analytical, motivated, and genuinely considering making this their life's work. If you're here to add a credential, this isn't for you.</span>
            <br />
            <span className="text-bluedot-navy/60">And to be clear: this is not a corporate AI governance or AI ethics course.</span>
          </>
        ),
      },
      {
        icon: PiClockClockwise,
        label: 'Time',
        description: '~30 hours total',
      },
      {
        icon: PiChats,
        label: 'Format',
        description: (
          <>
            <span className="font-semibold">2-3 hours</span> readings, exercises and reflections per unit
            <br />
            <span className="font-semibold">2 hours live discussion</span> with your cohort of 7-9 per unit
            <br />
            Led by a Teaching Fellow working in AI governance
          </>
        ),
      },
      {
        icon: PiHandHeart,
        label: 'Price',
        description: 'Free (pay-what-you-want)',
      },
      {
        icon: PiCalendarDots,
        label: 'Schedule',
        description: null,
        isSchedule: true,
        scheduleDescription: (
          <>
            <span className="font-semibold">INTENSIVE:</span> 6 days, ~5h/day
            <br />
            <span className="font-semibold">PART-TIME:</span> 6 weeks, ~5h/week
          </>
        ),
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
            <br />
            • Orient yourself to the existing literature about your chosen area
            <br />
            • Talk to people who are already working on the problem
            <br />
            • Quickly test what it means to contribute in this area
          </>
        ),
      },
      {
        icon: PiChats,
        label: 'Format',
        description: 'This is currently a self-paced project. A guided version with coaching is planned — check back in April 2026.',
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
            <br />
            • Provide regular updates on your progress
            <br />
            • Join ~8 peers and an AI safety expert in a 1-hour check-in to discuss your progress and get feedback
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
