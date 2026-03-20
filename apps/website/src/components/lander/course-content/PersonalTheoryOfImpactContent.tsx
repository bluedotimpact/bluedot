import {
  PiClockClockwise,
  PiHandHeart,
  PiCalendarDots,
  PiRocketLaunch,
  PiUsersThree,
  PiCompass,
  PiGraduationCap,
  PiNotePencil,
  PiLightbulb,
  PiChats,
} from 'react-icons/pi';
import { type CourseLanderContent } from '../CourseLander';

export const PERSONAL_TOI_START_URL = '/courses/personal-theory-of-impact/1/1';

// Custom color theme for Personal Theory of Impact - slight teal/green shift from AGI Strategy's pink-purple
const TOI_COLORS = {
  /* Gradient layers:
     1. Left-side darkness - horizontal gradient to darken left edge for text readability
     2. Main colorful gradient - teal→purple→dark blue from bottom-right (warmer teal vs AGI Strategy's pink)
     3. Base color - dark navy (same family as AGI Strategy) */
  gradient: 'linear-gradient(to right, rgba(10, 8, 36, 0.9) 0%, rgba(10, 8, 36, 0.4) 5%, rgba(10, 8, 36, 0.15) 15%, rgba(10, 8, 36, 0.05) 30%, transparent 45%), radial-gradient(115% 175% at 95% 135%, rgba(150, 230, 210, 0.55) 0%, rgba(130, 200, 195, 0.40) 25%, rgba(42, 60, 106, 0.65) 60%, rgba(10, 8, 36, 0.60) 100%), #181D3F',
  accent: '#A0DCC8', // Soft teal accent
  iconBackground: '#2C4F6B', // Teal-navy for icons
  bright: '#E0F5EE', // Light teal for benefit icons
  mid: '#6BB8A0', // Mid-tone teal
  full: '#5A9E8A', // Full teal for course info
};

export const createPersonalTheoryOfImpactContent = (
  applicationUrlWithUtm: string,
  courseSlug: string,
): CourseLanderContent => ({
  meta: {
    title: 'Personal Theory of Impact | BlueDot Impact',
    description: 'Figure out how you can contribute to AI safety. Produce a 1-2 page brief on what you would spend 6 months working on.',
  },

  hero: {
    gradient: TOI_COLORS.gradient,
    accentColor: TOI_COLORS.accent,
    categoryLabel: 'SELF-PACED PROJECT',
    title: 'Personal Theory of Impact',
    description: 'There are no easy answers for ensuring the future goes well.\n\nFocus on the specifics of how you can contribute, so you can start taking action.',
    primaryCta: {
      text: 'Get started',
      url: `/courses/${courseSlug}/1/1`,
    },
    imageSrc: '/images/lander/agi-strategy/hero-graphic.png',
    imageAlt: 'Personal Theory of Impact visualisation',
    imageAspectRatio: '1408/1122',
  },

  personas: {
    title: 'Who this project is for',
    accentColor: TOI_COLORS.iconBackground,
    defaultExpandedIndex: -1,
    personas: [
      {
        icon: PiGraduationCap,
        title: 'AGI Strategy Course graduates',
        summary: 'You understand the stakes. Now you need to figure out what you personally should do about it.',
        description: 'You\'ve completed the AGI Strategy Course (or equivalent). You understand the AI safety landscape — the threat pathways, the actors, the challenges. But understanding the problem and knowing how to contribute are different things. You have a scattered sense of what you could do, but no concrete plan.',
        valueProposition: 'This project gives you a structured process to go from "I want to help" to "here\'s specifically what I\'d spend 6 months working on and why." You\'ll produce a brief that crystallises your thinking — and the process of creating it is where the real clarity comes from.',
      },
      {
        icon: PiCompass,
        title: 'People who feel deeply confused about what to work on',
        summary: 'You have ideas, but you\'re not sure which ones matter. That confusion is normal — and productive.',
        description: 'You care deeply about making AI go well. You\'ve read a lot, maybe taken courses, and have a growing list of areas that seem important. But the more you learn, the less certain you feel. You don\'t know if your instincts are right, or if you\'re missing something obvious.',
        valueProposition: 'Confusion is the starting point, not the obstacle. This project pushes you to resolve it by doing — talking to practitioners, testing your fit, and narrowing down through action rather than more reading. You\'ll come out with a concrete direction, not just more options.',
      },
      {
        icon: PiRocketLaunch,
        title: 'People ready to take action',
        summary: 'You\'re done deliberating. You want a process that forces clarity.',
        description: 'You\'ve done the thinking. You have domain expertise — maybe in engineering, policy, research, or operations — and you believe it\'s relevant to AI safety. But you haven\'t committed to a specific path because you\'re not sure where your skills are most needed or how to validate your ideas.',
        valueProposition: 'This project is designed for people who learn by doing. You\'ll talk to people already in the field, build quick prototypes of your ideas, and stress-test your assumptions. By the end, you\'ll have a specific, well-reasoned case for what you should be working on.',
      },
    ],
  },

  courseBenefits: {
    title: 'How this course will benefit you',
    iconBackgroundColor: TOI_COLORS.bright,
    benefits: [
      {
        icon: PiNotePencil,
        title: 'Produce a focused brief',
        description: 'Create a 1-2 page brief on what you\'d spend 6 months working on full-time. The process of writing it is where the clarity comes from.',
      },
      {
        icon: PiUsersThree,
        title: 'Gain clarity by taking action',
        description: 'Don\'t just think — do. Talk to people working on the problem, build quick prototypes, write up your reasoning. The fastest way to figure out where you fit is to go out into the world and test it.',
      },
      {
        icon: PiLightbulb,
        title: 'Build on your unique expertise',
        description: 'Lean into your domain background to figure out where your skills are most needed. Go deep on specific problems rather than staying abstract.',
      },
    ],
  },

  courseInformation: {
    title: 'Project information',
    applicationUrl: applicationUrlWithUtm,
    scheduleCtaText: 'Get started',
    courseSlug,
    accentColor: TOI_COLORS.full,
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

  hideTestimonials: true,

  faq: {
    title: 'Frequently Asked Questions',
    items: [
      {
        id: 'prerequisites',
        question: 'Do I need to complete the AGI Strategy Course first?',
        answer: (
          <>
            Yes, or an equivalent. You need a foundational understanding of the AI safety landscape. If there's a domain course relevant to your area (e.g., <a href="https://bluedot.org/courses/technical-ai-safety" target="_blank" rel="noopener noreferrer" className="underline">Technical AI Safety</a>, <a href="https://bluedot.org/courses/ai-governance" target="_blank" rel="noopener noreferrer" className="underline">AI Governance</a>, <a href="https://bluedot.org/courses/biosecurity" target="_blank" rel="noopener noreferrer" className="underline">Biosecurity</a>), we recommend taking that first too, so you have a larger surface area of ideas to work with.
          </>
        ),
      },
      {
        id: 'difference',
        question: 'How is this different from the Technical AI Safety Project Sprint?',
        answer: (
          <>
            The <a href="https://bluedot.org/courses/technical-ai-safety-project" target="_blank" rel="noopener noreferrer" className="underline">Project Sprint</a> is for people who want to make a technical contribution to AI safety research or engineering. The Personal Theory of Impact is for anyone who wants to figure out how they can best contribute — technical or otherwise.
          </>
        ),
      },
      {
        id: 'output',
        question: 'What\'s the expected output?',
        answer: (
          <>
            A 1-2 page brief with specific things you would spend 6 months full-time working on and why, plus a log of:
            <br />
            • Who you've spoken to and what you learned
            <br />
            • Things you tried or built, and what this taught you
            <br />
            • What you've read and ideas you engaged with
          </>
        ),
      },
      {
        id: 'time',
        question: 'How much time should I spend on this?',
        answer: 'At least 20 hours over 2 weeks. You need enough time to research, talk to people, and test ideas — not just fill in a template. Gaining clarity is an active process that requires you to take action.',
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
            We're an intense 7-person team. We've raised $35M in total, including $25M in 2025.
          </>
        ),
      },
    ],
  },

  banner: {
    title: 'Figure out how you can contribute to AI safety',
    ctaText: 'Get started',
    ctaUrl: applicationUrlWithUtm,
    imageSrc: '/images/lander/agi-strategy/hero-banner-split.webp',
    imageAlt: 'Personal Theory of Impact banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.webp',
  },
});
