import {
  PiFlask,
  PiClockClockwise,
  PiChats,
  PiHandHeart,
  PiCalendarDots,
  PiRocketLaunch,
  PiUsersThree,
  PiCode,
  PiChalkboardTeacherLight,
  PiGraduationCap,
} from 'react-icons/pi';
import { CourseLanderContent } from '../CourseLander';

export const TECHNICAL_AI_SAFETY_PROJECT_APPLICATION_URL = 'https://web.miniextensions.com/2lQmY04m6DdfeGbIYgsG';

export const createTechnicalAiSafetyProjectContent = (
  applicationUrlWithUtm: string,
  courseSlug: string,
): CourseLanderContent => ({
  meta: {
    title: 'Technical AI Safety Project | BlueDot Impact',
    description: 'Make a technical contribution to AI safety in 30 hours.',
  },

  hero: {
    categoryLabel: 'TECHNICAL AI SAFETY PROJECT',
    title: 'Make a technical contribution to AI safety in 30 hours',
    description: 'Work with an AI safety expert to make a contribution to AI safety research or engineering. All in 30 hours.',
    primaryCta: {
      text: 'Apply now',
      url: applicationUrlWithUtm,
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: `/courses/${courseSlug}/1/1`,
    },
    imageSrc: '/images/lander/technical-ai-safety/hero-banner-split.webp',
    imageAlt: 'Technical AI Safety Project visualisation',
  },

  whoIsThisFor: {
    title: 'Who this course is for',
    targetAudiences: [
      {
        icon: PiCode,
        boldText: 'For software engineers',
        description: 'who want to contribute their technical skills to build tools for or scale AI safety research.',
      },
      {
        icon: PiFlask,
        boldText: 'For early researchers',
        description: 'who want to build their AI safety research portfolio.',
      },
      {
        icon: PiGraduationCap,
        boldText: 'For Technical AI Safety course graduates',
        description: 'who want to build their portfolio.',
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
        title: 'Publish a project in 30 hours',
        description: (
          <>
            Go from extending a paper or improving research code to a published write-up.
            <br /><br />
            <a href="https://bluedot.org/projects/" target="_blank" rel="noopener noreferrer" className="underline">Past participants</a> have reproduced findings from METR, fixed TransformerLens issues, and replicated evals using Inspect. You'll publish a blog post and X thread showcasing your work.
          </>
        ),
      },
      {
        icon: PiUsersThree,
        title: 'Find collaborators and opportunities',
        description: "We'll feature the best projects on our website and socials. Past graduates have found co-founders, collaborators, roles, and funding through their projects. Your write-up becomes a public signal of your skills.",
      },
      {
        icon: PiChalkboardTeacherLight,
        title: 'Get mentorship from an AI safety expert',
        description: 'You\'ll have regular check-ins with an AI safety expert who can debug your approach, validate extension ideas, and give rapid feedback. No more spinning your wheels alone. Get answers in hours, not days.',
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
  communityMembers: [
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
            You should be comfortable coding—either through professional experience or a few fully completed projects. Our mentorship focuses on scoping and refining your project ideas, not teaching you to code.

            If you're not comfortable coding, you could instead work on a written project, like a blog post reflecting on a past BlueDot course or exploring different ways you could contribute to AI safety.
          </>
        ),
      },
      {
        id: 'technical-ai-safety',
        question: 'Do I need to take the Technical AI Safety course first?',
        answer: (
          <>
            We designed this course as a follow-up to the Technical AI Safety course. We will be prioritising graduates from the course, but we'll also consider applicants who can demonstrate equivalent knowledge of technical AI safety concepts.
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
    title: 'Make a technical contribution to AI safety',
    ctaText: 'Apply now',
    ctaUrl: applicationUrlWithUtm,
    imageSrc: '/images/agi-strategy/hero-banner-split.png',
    imageAlt: 'Technical AI Safety banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.webp',
  },
});
