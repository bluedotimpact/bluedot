import {
  PiClockClockwise,
  PiChats,
  PiHandHeart,
  PiCalendarDots,
} from 'react-icons/pi';
import { type CourseLanderContent } from '../CourseLander';

export const AGI_STRATEGY_COLORS = {
  /* Gradient layers:
     1. Left-side darkness - horizontal gradient to darken left edge for text readability
     2. Main colorful gradient - pink→purple→dark blue from bottom-right
     3. Base color - dark navy */
  gradient: 'linear-gradient(to right, rgba(10, 8, 36, 0.9) 0%, rgba(10, 8, 36, 0.4) 5%, rgba(10, 8, 36, 0.15) 15%, rgba(10, 8, 36, 0.05) 30%, transparent 45%), radial-gradient(115% 175% at 95% 135%, rgba(255, 194, 195, 0.65) 0%, rgba(255, 194, 195, 0.50) 25%, rgba(53, 42, 106, 0.65) 60%, rgba(10, 8, 36, 0.60) 100%), #181D3F',
  accent: '#BCA9FF',
  iconBackground: '#2C3F81',
  bright: '#f3e8ff',
  full: '#9177dc',
};

export const createAgiStrategyContent = (
  applicationUrlWithUtm: string,
  courseSlug: string,
): CourseLanderContent => ({
  meta: {
    title: 'AGI Strategy Course | BlueDot Impact',
    description: 'The launchpad for AI safety work. In 25 hours, understand the landscape, pick a direction, and start moving.',
  },

  hero: {
    gradient: AGI_STRATEGY_COLORS.gradient,
    accentColor: AGI_STRATEGY_COLORS.accent,
    categoryLabel: 'COHORT-BASED COURSE',
    title: 'AGI Strategy',
    description: 'Optimistic and concerned about AI\'s trajectory? Want to do something about it? Start here.\n\n25 hours to understand the strategic landscape, find your entry point, and get moving.',
    primaryCta: {
      text: 'Apply now',
      url: applicationUrlWithUtm,
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: `/courses/${courseSlug}/1/1`,
    },
    imageSrc: '/images/lander/agi-strategy/hero-graphic.png',
    imageAlt: 'AGI Strategy visualization',
    imageAspectRatio: '1408/1122',
  },

  whoIsThisForText: {
    title: 'Who this course is for',
    paragraphs: [
      'You\'ve read some essays, watched the talks, and you don\'t think the people building AGI have a serious plan for making it go well. You want to change that.',
      'The course is an in-depth introduction to what\'s going on with AI development, what the good and bad outcomes could be, and what could be done to steer AI towards better futures.',
      'It\'s built for three groups: 1) domain experts in policy, security, operations, or engineering looking to redirect their skills; 2) people heading into technical safety or governance roles who want the strategic picture first; and 3) newcomers who are serious about making big moves and having a huge impact.',
      'Not sure you fit? Apply anyway. Recent cohorts have also included teachers, lawyers, engineers, and community organisers.',
    ],
    bottomCta: {
      text: 'Applying takes about 15 minutes.',
      buttonText: 'Apply now',
      buttonUrl: applicationUrlWithUtm,
    },
  },

  courseBenefitsText: {
    title: 'How this course will benefit you',
    items: [
      {
        heading: 'A launchpad for your AI safety career',
        body: 'You\'ll leave this course with an opinion on which threats matter, early takes on how we could solve these problems, and concrete next steps you can take.',
      },
      {
        heading: 'A clear way to think about the future of AI',
        body: 'You\'ll analyse the incentives facing AI companies. You\'ll develop "kill chains" to analyse the threats. And you\'ll apply defense in depth to evaluate and prioritise interventions. You\'ll know enough to hold your own in rooms with experts.',
      },
      {
        heading: 'A community of builders',
        body: 'BlueDot has 7,000+ alumni, with many now working at Anthropic, DeepMind, UK AISI, and dozens of organisations working on a safe transition to advanced AI. You\'ll meet people in the field who can open doors for you and pressure-test your thinking.',
      },
    ],
  },

  courseInformation: {
    title: 'Course information',
    applicationUrl: applicationUrlWithUtm,
    scheduleCtaText: 'Apply now',
    courseSlug,
    accentColor: AGI_STRATEGY_COLORS.full,
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

  pathwaysList: {
    title: 'What happens after',
    intro: 'This course is where you get oriented. What comes next depends on you.',
    items: [
      {
        title: 'Technical AI Safety',
        summary: 'Interpretability, evals, alignment research. For people ready to work on the technical problems.',
        href: '/courses/technical-ai-safety',
        ctaLabel: 'Explore the course',
      },
      {
        title: 'AI Governance',
        summary: 'Policy, institutions, international coordination. For people shaping how these systems get governed.',
        href: '/courses/ai-governance',
        ctaLabel: 'Explore the course',
      },
      {
        title: 'Biosecurity',
        summary: 'Pandemic preparedness, early warning systems, policy. For people building defences against bio risks.',
        href: '/courses/biosecurity',
        ctaLabel: 'Explore the course',
      },
      {
        title: 'Rapid Grants',
        summary: 'Small, fast funding for concrete AI safety work. Five-minute application, decisions in days, money upfront by default.',
        href: '/programs/rapid-grants',
        ctaLabel: 'Explore program',
      },
      {
        title: 'Career Transition Grants',
        summary: 'Funding to enable you to work full-time on impactful AI safety work. Propose your plan and we\'ll back you.',
        href: '/programs/career-transition-grant',
        ctaLabel: 'Explore program',
      },
    ],
  },

  quotes: {
    cardBackgroundColor: AGI_STRATEGY_COLORS.bright,
    accentColor: AGI_STRATEGY_COLORS.full,
    quotes: [
      {
        quote: '"We should not underestimate the real threats coming from AI [while] we have a narrowing window of opportunity to guide this technology responsibly."',
        name: 'Ursula von der Leyen',
        role: 'President, European Commission',
        imageSrc: '/images/agi-strategy/ursula.webp',
        url: 'https://neighbourhood-enlargement.ec.europa.eu/news/2023-state-union-address-president-von-der-leyen-2023-09-13_en',
      },
      {
        quote: '"I\'ve always thought of AI as the most profound technology humanity is working on. More profound than fire or electricity or anything that we\'ve done in the past… The downside is, at some point, that humanity loses control of the technology it\'s developing."',
        name: 'Sundar Pichai',
        role: 'CEO, Google',
        imageSrc: '/images/agi-strategy/sundar.webp',
        url: 'https://garrisonlovely.substack.com/p/a-compilation-of-tech-executives',
      },
      {
        quote: '"AI could surpass almost all humans at almost everything shortly after 2027."',
        name: 'Dario Amodei',
        role: 'CEO, Anthropic',
        imageSrc: '/images/lander/foai/dario.webp',
        url: 'https://arstechnica.com/ai/2025/01/anthropic-chief-says-ai-could-surpass-almost-all-humans-at-almost-everything-shortly-after-2027/',
      },
      {
        quote: '"I\'m all in favor of accelerating technological progress, but there is something unsettling about the way OpenAI explicitly declares its mission to be the creation of AGI. AI is a wonderful tool for the betterment of humanity; AGI is a potential successor species … To the extent the mission produces extra motivation for the team to ship good products, it\'s a positive. To the extent it might actually succeed, it\'s a reason for concern."',
        name: 'David Sacks',
        role: 'White House AI and Crypto Czar',
        imageSrc: '/images/agi-strategy/david-sacks.webp',
        url: 'https://x.com/HumanHarlan/status/1864858286065111298',
      },
    ],
  },

  faq: {
    title: 'Frequently Asked Questions',
    items: [
      {
        id: 'background',
        question: 'What background do I need?',
        answer: 'We don\'t care about your CV. We care about what you\'ll do next. We\'ve had participants from policy, engineering, law, medicine, operations, and academia - what they shared was drive and a bias toward action.',
      },
      {
        id: 'beginners',
        question: 'Is this course for beginners?',
        answer: 'It\'s for people who are new to working on AI safety, not new to taking things seriously. If you\'ve been reading and thinking and are ready to stop orbiting, this is where you start.',
      },
      {
        id: 'formats',
        question: 'What\'s the difference between intensive and part-time?',
        answer: 'Same content, different pace. Intensive is 5 days at ~5 hours/day - for people who can clear a week and want to move fast. Part-time is 5 weeks at ~5 hours/week - for people building this around other commitments. Both get you to the same place.',
      },
      {
        id: 'direction',
        question: 'What if I don\'t know which direction I want to go?',
        answer: 'That\'s what the course is for. You\'ll leave knowing which problems matter most to you and which path fits your skills - technical research, governance, biosecurity, or building something new. Figuring it out is the work.',
      },
      {
        id: 'funding',
        question: 'Is there funding available?',
        answer: (
          <>
            Yes, for people who are building.
            <br /><br />
            <span className="font-semibold">Rapid Small Grants ($50–$1,500):</span> For participants who need compute, conference travel, research access, or tools. Apply in under 15 minutes, hear back within 5 days.
            <br /><br />
            <span className="font-semibold">Incubator Grants ($10–50K):</span> For participants who come out ready to launch something. Selective, awarded through our incubator programme - not a direct application.
            <br /><br />
            We're not here to fund curiosity. But if you're building something ambitious that matters, we will back you.
          </>
        ),
      },
      {
        id: 'free',
        question: 'Is it really free?',
        answer: 'Yes.',
      },
      {
        id: 'bluedot',
        question: 'Who is BlueDot Impact?',
        answer: 'BlueDot is the leading talent accelerator for beneficial AI and societal resilience. We run courses, help people land jobs, organise events all over the world, and accelerate entrepreneurs to start new companies. We\'ve trained 7,000+ people since 2022. Our alumni are now at Anthropic, DeepMind, UK AISI, and have started new organisations working on safely navigating the transition to AGI.',
      },
    ],
  },

  banner: {
    title: 'Start building towards a good future today',
    ctaText: 'Apply now',
    ctaUrl: applicationUrlWithUtm,
    imageSrc: '/images/lander/agi-strategy/hero-banner-split.webp',
    imageAlt: 'AGI Strategy banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.webp',
  },
});
