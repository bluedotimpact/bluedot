import {
  PiBriefcase,
  PiCompass,
  PiClockClockwise,
  PiChats,
  PiHandHeart,
  PiCalendarDots,
  PiRocketLaunch,
  PiUsersThree,
  PiLightbulb,
  PiCpu,
  PiBank,
  PiShieldCheck,
} from 'react-icons/pi';
import { CourseLanderContent } from '../CourseLander';

const AGI_STRATEGY_COLORS = {
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
    description: 'The launchpad for AI safety work. In 30 hours, understand the landscape, pick a direction, and start moving.',
  },

  hero: {
    gradient: AGI_STRATEGY_COLORS.gradient,
    accentColor: AGI_STRATEGY_COLORS.accent,
    categoryLabel: 'COHORT-BASED COURSE',
    title: 'AGI Strategy',
    description: "Stop orbiting. Launch.\n\nIn 30 hours, you'll understand the landscape, pick a direction, and actually start moving.",
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

  whoIsThisFor: {
    iconBackgroundColor: AGI_STRATEGY_COLORS.iconBackground,
    title: 'Who this course is for',
    targetAudiences: [
      {
        icon: PiRocketLaunch,
        boldText: 'For people who are done reading about AI risk',
        description: 'and ready to actually work on it.',
      },
      {
        icon: PiBriefcase,
        boldText: 'For domain experts - in policy, security, operations, engineering -',
        description: 'who want to point their skills at the most important problem of our time.',
      },
      {
        icon: PiCompass,
        boldText: 'For those planning to go deep on technical safety or governance,',
        description: 'and want the strategic context first.',
      },
    ],
    bottomCta: {
      boldText: "Don't fit these perfectly? Apply anyway.",
      text: 'Some of our most impactful participants have included teachers, lawyers, engineers, and community leaders. We bet on drive and ambition, not CVs.',
      buttonText: 'Apply now',
      buttonUrl: applicationUrlWithUtm,
    },
  },

  courseBenefits: {
    title: 'How this course will benefit you',
    iconBackgroundColor: AGI_STRATEGY_COLORS.bright,
    benefits: [
      {
        icon: PiRocketLaunch,
        title: 'A launchpad, not a lecture',
        description: "This is not a course you \"complete.\" It's the starting point for whatever you do next. You'll leave knowing which problems matter most, which paths make sense for your background, and what to do next.",
      },
      {
        icon: PiLightbulb,
        title: 'Frameworks that cut through the noise',
        description: "Three mental models that replace months of scattered reading: incentive mapping to understand the race to AGI, kill chains to analyze threats, and defense-in-depth to design interventions. You'll leave able to hold your own in conversations with people already in the field.",
      },
      {
        icon: PiUsersThree,
        title: 'A community of people who ship',
        description: "We have 7,000+ alumni at Anthropic, DeepMind, UK AISI, and dozens of organizations making sure humanity safely navigates transformative AI. You'll meet people already doing the work - and who'll open doors and pressure-test your thinking.",
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

  pathways: {
    title: 'What happens after',
    intro: 'The AGI Strategy Course is where you get oriented. What comes next depends on you.',
    pathways: [
      {
        icon: PiCpu,
        title: 'Technical AI Safety',
        description: 'Interpretability, evals, alignment research. For people ready to work on the technical problems.',
        accentColor: 'hsla(284, 46%, 30%, 1)', // TAS iconBackground
        linkUrl: '/courses/technical-ai-safety',
        linkText: 'Explore the course',
      },
      {
        icon: PiBank,
        title: 'AI Governance',
        description: 'Policy, institutions, international coordination. For people shaping how we govern these systems.',
        accentColor: '#1F588A', // AI Gov iconBackground
        linkUrl: '/courses/ai-governance',
        linkText: 'Explore the course',
      },
      {
        icon: PiShieldCheck,
        title: 'Biosecurity',
        description: 'Pandemic preparedness, early warning systems, policy. For people building defences against bio risks.',
        accentColor: '#316761', // Biosecurity iconBackground
        linkUrl: '/courses/biosecurity',
        linkText: 'Explore the course',
      },
      {
        icon: PiRocketLaunch,
        title: 'Make a bigger leap',
        description: 'Pivot directly into high-impact work, or start building something new. We can help.',
        accentColor: AGI_STRATEGY_COLORS.iconBackground,
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

  partners: {
    title: 'Co-created with our network of leading AI industry partners',
    partners: [
      {
        name: 'Entrepreneur First',
        url: 'https://www.joinef.com/',
        logo: '/images/agi-strategy/ef.svg',
        descriptionShort: (
          <>
            We collaborate with EF to host AI safety and def/acc <a href="https://luma.com/AI-security-hackathon" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity">hackathons</a>.
          </>
        ),
        descriptionFull: (
          <>
            A London-based startup incubation programme. We collaborate with EF to host AI safety and def/acc <a href="https://luma.com/AI-security-hackathon" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity">hackathons</a>. See <a href="https://luma.com/bluedotevents" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity">here</a> for future events.
          </>
        ),
      },
      {
        name: 'Institute for Progress',
        url: 'https://ifp.org/',
        logo: '/images/agi-strategy/ifp.svg',
        descriptionShort: (
          <>
            We collaborate with IFP to get impactful projects from their <a href="https://ifp.org/the-launch-sequence/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity">Launch Sequence</a> off the ground.
          </>
        ),
        descriptionFull: (
          <>
            IFP is a science and innovation think tank. We collaborate with IFP to get impactful projects from their <a href="https://ifp.org/the-launch-sequence/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity">Launch Sequence</a> off the ground.
          </>
        ),
      },
      {
        name: '50 Years',
        url: 'https://www.fiftyyears.com/',
        logo: '/images/agi-strategy/fifty-years.svg',
        descriptionShort: (
          <>
            We fast-track our most promising entrepreneurs into their <a href="https://www.fiftyyears.com/5050/ai" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity">5050 AI cohorts</a>, focused on building an aligned AI future.
          </>
        ),
        descriptionFull: (
          <>
            A pre-seed and seed VC firm. We fast-track our most promising entrepreneurs into their <a href="https://www.fiftyyears.com/5050/ai" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity">5050 AI cohorts</a>, focused on building an aligned AI future.
          </>
        ),
      },
      {
        name: 'Seldon Lab',
        url: 'https://seldonlab.com/',
        logo: '/images/agi-strategy/seldon-lab.svg',
        descriptionShort: (
          <>
            We help our most entrepreneurial community members get ready to join future Seldon batches.
          </>
        ),
        descriptionFull: (
          <>
            Seldon offers guidance and investments in the next generation of AGI security startups. We help our most entrepreneurial community members get ready to join future Seldon batches.
          </>
        ),
      },
      {
        name: 'Halcyon Futures',
        url: 'https://halcyonfutures.org/',
        logo: '/images/agi-strategy/halcyon-futures.svg',
        descriptionShort: (
          <>
            We introduce our most promising leaders to Halcyon.
          </>
        ),
        descriptionFull: (
          <>
            Halcyon identifies leaders from business, policy, and academia, and helps them take on new ambitious projects. We introduce our most promising leaders to Halcyon.
          </>
        ),
      },
    ],
  },

  faq: {
    title: 'Frequently Asked Questions',
    items: [
      {
        id: 'background',
        question: 'What background do I need?',
        answer: "We don't care about your CV. We care about what you'll do next. We've had participants from policy, engineering, law, medicine, operations, and academia - what they shared was drive and a bias toward action.",
      },
      {
        id: 'beginners',
        question: 'Is this course for beginners?',
        answer: "It's for people who are new to working on AI safety, not new to taking things seriously. If you've been reading and thinking and are ready to stop orbiting, this is where you start.",
      },
      {
        id: 'formats',
        question: "What's the difference between intensive and part-time?",
        answer: 'Same content, different pace. Intensive is 5 days at ~5 hours/day - for people who can clear a week and want to move fast. Part-time is 5 weeks at ~5 hours/week - for people building this around other commitments. Both get you to the same place.',
      },
      {
        id: 'direction',
        question: "What if I don't know which direction I want to go?",
        answer: "That's what the course is for. You'll leave knowing which problems matter most to you and which path fits your skills - technical research, governance, biosecurity, or building something new. Figuring it out is the work.",
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
        answer: "BlueDot is the leading talent accelerator for beneficial AI and societal resilience. We run courses, help people land jobs, organise events all over the world, and accelerate entrepreneurs to start new companies. We've trained 7,000+ people since 2022. Our alumni are now at Anthropic, DeepMind, UK AISI, and have started new organisations working on safely navigating the transition to AGI.",
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
