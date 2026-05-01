import {
  PiRocketLaunch,
  PiUsersThree,
  PiCompass,
  PiGraduationCap,
  PiNotePencil,
  PiLightbulb,
} from 'react-icons/pi';
import { type CourseLanderContent } from '../CourseLander';
import { COURSE_COLORS } from '../../../lib/courseColors';

export const PERSONAL_TOI_START_URL = '/courses/personal-theory-of-impact/1/1';

const TOI_COLORS = COURSE_COLORS['personal-theory-of-impact'];

export const createPersonalTheoryOfImpactContent = (
  applicationUrlWithUtm: string,
  _courseSlug: string,
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
      url: applicationUrlWithUtm,
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
        summary: 'You understand the landscape. Now you need to figure out what you personally should do about it.',
        description: 'You\'ve completed the AGI Strategy Course (or equivalent) and understand the threat pathways, actors, and challenges. But understanding the problem and knowing how to contribute are different things.',
        valueProposition: 'This project takes you from "I want to help" to "here\'s what I\'d spend 6 months working on and why." You\'ll produce a brief that crystallises your thinking through action, not just reflection.',
      },
      {
        icon: PiCompass,
        title: 'People confused about how to contribute',
        summary: 'You have ideas, but you\'re not sure which ones matter. It\'s normal to be confused!',
        description: 'You\'ve read a lot, maybe taken courses, and have a growing list of areas that seem important. But the more you learn, the less certain you feel about where you\'d actually be useful.',
        valueProposition: 'This project pushes you to resolve confusion by doing — talking to people actually working on the problem, testing your fit, and narrowing down where you can be most impactful with  more structure.',
      },
      {
        icon: PiRocketLaunch,
        title: 'People ready to take action',
        summary: 'You\'re done deliberating. You want a process that forces clarity.',
        description: 'You have skills and experiences which you believe are relevant to AI safety. But you haven\'t committed to a specific path because you\'d be most impactful.',
        valueProposition: 'You\'ll talk to people in the field, test your ideas, and stress-test your assumptions. By the end, you\'ll have a specific, well-reasoned case for what you should be working on.',
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

  hideTestimonials: true,

  faq: {
    title: 'Frequently Asked Questions',
    items: [
      {
        id: 'prerequisites',
        question: 'Do I need to complete the AGI Strategy Course first?',
        answer: (
          <>
            Yes, or demonstrate equivalent understanding of the AI safety landscape. If there's a domain course relevant to your area (e.g., <a href="https://bluedot.org/courses/technical-ai-safety" target="_blank" rel="noopener noreferrer" className="underline">Technical AI Safety</a>, <a href="https://bluedot.org/courses/ai-governance" target="_blank" rel="noopener noreferrer" className="underline">AI Governance</a>, <a href="https://bluedot.org/courses/biosecurity" target="_blank" rel="noopener noreferrer" className="underline">Biosecurity</a>), we recommend taking that first too, so you have a larger surface area of ideas to work with.
          </>
        ),
        answerText: 'Yes, or demonstrate equivalent understanding of the AI safety landscape. If there\'s a domain course relevant to your area (e.g., Technical AI Safety, AI Governance, Biosecurity), we recommend taking that first too, so you have a larger surface area of ideas to work with.',
      },
      {
        id: 'difference',
        question: 'How is this different from the Technical AI Safety Project Sprint?',
        answer: (
          <>
            The <a href="/courses/technical-ai-safety-project" className="underline">project sprint</a> is for people who want to make a technical contribution to AI safety research or engineering. This project is for anyone who wants to figure out how they can best contribute — technical or otherwise.
          </>
        ),
        answerText: 'The project sprint is for people who want to make a technical contribution to AI safety research or engineering. This project is for anyone who wants to figure out how they can best contribute — technical or otherwise.',
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
        answerText: 'A 1-2 page brief with specific things you would spend 6 months full-time working on and why, plus a log of: Who you\'ve spoken to and what you learned, Things you tried or built and what this taught you, What you\'ve read and ideas you engaged with.',
      },
      {
        id: 'time',
        question: 'How much time should I spend on this?',
        answer: 'At least 20 hours over 2 weeks. You need enough time to research, talk to people, and test ideas. Gaining clarity is an active process that requires you to take action.',
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
        answerText: 'We\'re a London-based startup. Since 2022, we\'ve trained 7,000+ people, with 100s now working on making AI go well. Our courses are the main entry point into the AI safety field. We\'re an intense 7-person team. We\'ve raised $35M in total, including $25M in 2025.',
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
