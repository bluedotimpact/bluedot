import {
  PiRocketLaunch,
  PiCalendarDots,
  PiMapPin,
  PiTarget,
  PiHandshake,
  PiCurrencyDollar,
  PiCompass,
  PiFlask,
  PiBriefcase,
  PiPath,
} from 'react-icons/pi';
import { CourseLanderContent } from '../CourseLander';

const INCUBATOR_WEEK_COLORS = {
  /* Gradient layers:
     1. Left-side darkness - horizontal gradient to darken left edge for text readability
     2. Main colorful gradient - burgundy/crimson from bottom-right
     3. Base color - deep burgundy */
  gradient: 'linear-gradient(to right, rgba(45, 12, 18, 0.95) 0%, rgba(45, 12, 18, 0.5) 5%, rgba(45, 12, 18, 0.2) 15%, rgba(45, 12, 18, 0.08) 30%, transparent 45%), radial-gradient(115% 175% at 95% 135%, rgba(255, 140, 140, 0.55) 0%, rgba(200, 80, 90, 0.50) 25%, rgba(120, 30, 50, 0.65) 60%, rgba(45, 12, 18, 0.70) 100%), #2D0C12',
  accent: '#FF8C8C',
  iconBackground: '#5C1F2E',
  bright: '#FFE8E8',
  full: '#C85058',
};

export const createIncubatorWeekContent = (
  applicationUrlWithUtm: string,
  courseSlug: string,
): CourseLanderContent => ({
  meta: {
    title: 'Incubator Week | BlueDot Impact',
    description: 'A 5-day intensive for founders building organizations to make AI go well. Develop threat models, design interventions, pitch for funding. All expenses paid in London.',
  },

  hero: {
    gradient: INCUBATOR_WEEK_COLORS.gradient,
    accentColor: INCUBATOR_WEEK_COLORS.accent,
    categoryLabel: '5-DAY INTENSIVE',
    title: 'Incubator Week',
    description: 'Training isn\'t enough. We need new organizations to make AI go well. Incubator Week takes the strongest founders from our courses and backs them to build. Five days. All expenses paid. Pitch for funding on Friday.\n\nCurrently on hiatus. Fill out our application to join the waitlist for future cohorts.',
    primaryCta: {
      text: 'Apply now',
      url: applicationUrlWithUtm,
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: `/courses/${courseSlug}/1/1`,
    },
    imageSrc: '/images/lander/agi-strategy/hero-graphic.png',
    imageAlt: 'Incubator Week visualization',
    imageAspectRatio: '1408/1122',
  },

  whoIsThisFor: {
    iconBackgroundColor: INCUBATOR_WEEK_COLORS.iconBackground,
    title: 'Who this is for',
    targetAudiences: [
      {
        icon: PiBriefcase,
        boldText: 'For technical founders',
        description: "who've identified a gap in AI safety infrastructure and want to fill it.",
      },
      {
        icon: PiFlask,
        boldText: 'For researchers',
        description: 'ready to leave the lab and ship something that changes behavior, not just beliefs.',
      },
      {
        icon: PiCompass,
        boldText: 'For operators',
        description: "who've seen how AI deployment actually works and know what's missing.",
      },
    ],
    bottomCta: {
      boldText: 'We select from our AGI Strategy and Technical AI Safety courses.',
      text: 'We\'re looking for people who can complete this sentence: "Last year I built ___ which resulted in ___." Apply to our courses first, and we\'ll invite the strongest participants to Incubator Week.',
      buttonText: 'Apply now',
      buttonUrl: applicationUrlWithUtm,
    },
  },

  courseBenefits: {
    title: "What you'll get",
    iconBackgroundColor: INCUBATOR_WEEK_COLORS.bright,
    benefits: [
      {
        icon: PiRocketLaunch,
        title: 'From problem to pitch in 5 days',
        description: "Monday: develop threat models and identify top experts. Tuesday-Wednesday: build and iterate on interventions, call experts, attend our community social. Thursday: create your pitch. Friday: pitch to us for funding. You'll make more progress in a week than most make in months.",
      },
      {
        icon: PiHandshake,
        title: 'Work alongside the best',
        description: "You'll work from our office at LISA alongside Apollo Research, Workshop Labs, and other leading AI safety organizations. We bring in founders, funders, and experts throughout the week to accelerate your work.",
      },
      {
        icon: PiCurrencyDollar,
        title: 'Get backed to build',
        description: "Strong pitches receive initial grants of £50k+ to work on your project full-time. Our first batch backed Exona — they've since raised more, work from our co-working space, and are already hiring. We're putting our money where our mouth is.",
      },
    ],
  },

  courseInformation: {
    title: 'Program information',
    applicationUrl: applicationUrlWithUtm,
    scheduleCtaText: 'Apply now',
    courseSlug,
    accentColor: INCUBATOR_WEEK_COLORS.full,
    details: [
      {
        icon: PiPath,
        label: 'The week',
        description: (
          <>
            <span className="font-semibold">Monday:</span> Threat models and problem space exploration.
            <br />
            <span className="font-semibold">Tue-Wed:</span> Build interventions, call experts, community social.
            <br />
            <span className="font-semibold">Thursday:</span> Create your pitch.
            <br />
            <span className="font-semibold">Friday:</span> Pitch for funding.
          </>
        ),
      },
      {
        icon: PiMapPin,
        label: 'Location',
        description: "In-person in London, working from LISA alongside Apollo Research and other leading organizations. We'll fly you in and cover all expenses.",
      },
      {
        icon: PiTarget,
        label: 'Focus areas',
        description: "AI safety, biosecurity, cybersecurity, and other catastrophic risk reduction. For now we're focused on for-profit companies.",
      },
      {
        icon: PiCalendarDots,
        label: 'Schedule',
        description: 'Currently on hiatus. Fill out our application to join the waitlist for future cohorts.',
      },
    ],
  },

  faq: {
    title: 'Frequently Asked Questions',
    items: [
      {
        id: 'how-to-join',
        question: 'How do I join Incubator Week?',
        answer: 'The AGI Strategy Course and Technical AI Safety Course are our primary feeders. We filter the best participants through problem statement quality, then interview before inviting to Incubator Week.',
      },
      {
        id: 'solo-or-team',
        question: 'Can I apply solo or do I need a co-founder?',
        answer: "Both work. Solo founders are welcome — though we've learned that co-founder matching is hard, so coming with a partner (friend, classmate, existing co-founder) is a plus. We'll help facilitate connections during the week.",
      },
      {
        id: 'expenses',
        question: 'What expenses are covered?',
        answer: "Everything. We'll fly you to London, provide accommodation, and cover all meals during the week. You just need to show up ready to build.",
      },
      {
        id: 'tracks',
        question: 'What tracks do you support?',
        answer: "For now we're focused on for-profit companies. We're keen to explore other areas as well, especially policy entrepreneurship.",
      },
      {
        id: 'funding',
        question: 'How does the funding work?',
        answer: 'Strong pitches on Friday receive initial grants of £50k+ to work on your project full-time. This is designed to help you build momentum in the months after Incubator Week.',
      },
      {
        id: 'bluedot',
        question: 'Who is BlueDot Impact?',
        answer: (
          <>
            We're a London-based nonprofit. Since 2022, we've trained over 6,000 people. Our courses are the main entry point into the AI safety field, with alumni now working at OpenAI, Anthropic, DeepMind, the UK AI Safety Institute, and many more.
            <br /><br />
            Incubator Week is our program for the most entrepreneurial participants — the ones ready to build the organizations the world needs.
          </>
        ),
      },
    ],
  },

  banner: {
    title: 'Ready to build something that matters?',
    ctaText: 'Apply now',
    ctaUrl: applicationUrlWithUtm,
    imageSrc: '/images/lander/agi-strategy/hero-banner-split.webp',
    imageAlt: 'Incubator Week banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.webp',
  },
});
