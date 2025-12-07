import {
  PiClock,
  PiDesktop,
  PiCurrencyDollar,
  PiCertificate,
  PiRocketLaunch,
  PiLightbulb,
  PiUsers,
} from 'react-icons/pi';
import { CourseLanderContent } from '../CourseLander';

export const FUTURE_OF_AI_START_URL = '/courses/future-of-ai/1/1';

export const createFutureOfAiContent = (
  _applicationUrlWithUtm: string,
  courseSlug: string,
): CourseLanderContent => ({
  meta: {
    title: 'Future of AI Course | BlueDot Impact',
    description: 'Understand what\'s coming. Join the conversation. Get informed about AI\'s trajectory and society\'s biggest choices in just 2 hours. No technical background needed.',
  },

  hero: {
    categoryLabel: 'FUTURE OF AI',
    title: 'Understand what\'s coming. Join the conversation.',
    description: 'Get informed about AI\'s trajectory and society\'s biggest choices in just 2 hours. No technical background needed.',
    primaryCta: {
      text: 'Start the free course',
      url: FUTURE_OF_AI_START_URL,
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: `/courses/${courseSlug}/1/1`,
    },
    imageSrc: '/images/lander/foai/hero-banner-split.png',
    imageAlt: 'Future of AI visualization',
  },

  whoIsThisFor: {
    title: 'Who this course is for',
    targetAudiences: [
      {
        icon: PiUsers,
        boldText: 'For anyone who wants to understand AI\'s impact on society.',
        description: '',
      },
      {
        icon: PiLightbulb,
        boldText: 'For people concerned about AI\'s direction',
        description: 'and wanting to engage with the issues.',
      },
      {
        icon: PiRocketLaunch,
        boldText: 'For those ready to join the conversation',
        description: 'about humanity\'s technological future.',
      },
    ],
    bottomCta: {
      boldText: 'Not sure if this is for you?',
      text: 'If you read the news and wonder what AI actually means for your life, your community, and the world - this course is for you. No prerequisites. No technical knowledge required.',
      buttonText: 'Start the free course',
      buttonUrl: FUTURE_OF_AI_START_URL,
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
        icon: PiClock,
        title: 'Get informed in 2 hours',
        description: 'No degree required. This course replaces weeks of confusing articles with clear explanations of what\'s actually happening with AI and where it\'s headed.',
      },
      {
        icon: PiDesktop,
        title: 'Try the tools yourself',
        description: 'Don\'t just read about AI - use it. Interactive demos let you experience cutting-edge AI systems directly in your browser.',
      },
      {
        icon: PiUsers,
        title: 'Join thousands who care',
        description: 'Connect with a global community discussing AI\'s trajectory. Turn individual concern into collective understanding and action.',
      },
    ],
  },

  courseInformation: {
    title: 'Course information',
    applicationUrl: FUTURE_OF_AI_START_URL,
    scheduleCtaText: 'Start now',
    courseSlug,
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

  quotes: {
    quotes: [
      {
        quote: '"AI could surpass almost all humans at almost everything shortly after 2027."',
        name: 'Dario Amodei',
        role: 'CEO, Anthropic',
        imageSrc: '/images/lander/foai/dario.jpeg',
        url: 'https://arstechnica.com/ai/2025/01/anthropic-chief-says-ai-could-surpass-almost-all-humans-at-almost-everything-shortly-after-2027/',
      },
      {
        quote: '"We must take the risks of AI as seriously as other major global challenges, like climate change."',
        name: 'Demis Hassabis',
        role: 'CEO, Google DeepMind',
        imageSrc: '/images/lander/foai/demis.jpeg',
        url: 'https://www.bbc.com/news/technology-65760449',
      },
      {
        quote: '"We should not underestimate the real threats coming from AI [while] we have a narrowing window of opportunity to guide this technology responsibly."',
        name: 'Ursula von der Leyen',
        role: 'President, European Commission',
        imageSrc: '/images/lander/foai/ursula.png',
        url: 'https://neighbourhood-enlargement.ec.europa.eu/news/2023-state-union-address-president-von-der-leyen-2023-09-13_en',
      },
    ],
  },

  faq: {
    title: 'Frequently Asked Questions',
    items: [
      {
        id: 'technical-knowledge',
        question: 'Do I need technical knowledge?',
        answer: 'No. This course is designed for everyone. If you can use a web browser, you can take this course.',
      },
      {
        id: 'duration',
        question: 'How long does it take?',
        answer: 'About 2 hours total. You can complete it in one sitting or come back across multiple sessions - your progress is saved.',
      },
      {
        id: 'certificate',
        question: 'Will I get a certificate?',
        answer: 'Yes. Complete the course and you\'ll receive a certificate showing you understand AI\'s current capabilities and future trajectory.',
      },
      {
        id: 'bluedot',
        question: 'Who is BlueDot Impact?',
        answer: (
          <>
            We're the world's leading talent accelerator for beneficial AI and societal resilience. Since 2022, we've trained 6,000+ people. Our courses are the main entry point into the AI safety field. We're a small team. We've raised $34M in total, including $25M in 2025.
          </>
        ),
      },
    ],
  },

  banner: {
    title: 'Start understanding AI\'s future today',
    ctaText: 'Start the free course',
    ctaUrl: FUTURE_OF_AI_START_URL,
    imageSrc: '/images/lander/foai/hero-banner-split.png',
    imageAlt: 'Future of AI banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.webp',
  },
});
