import {
  PiClockClockwise,
  PiChats,
  PiHandHeart,
  PiCalendarDots,
  PiBank,
  PiHandshake,
  PiGraduationCap,
  PiBriefcase,
  PiCode,
  PiRocketLaunch,
  PiScales,
  PiMapTrifold,
  PiBookOpen,
  PiLightbulb,
  PiPath,
  PiUsersThree,
} from 'react-icons/pi';
import { type CourseLanderContent } from '../CourseLander';

export const AI_GOVERNANCE_COLORS = {
  gradient: `
    linear-gradient(270deg, rgba(5, 24, 67, 0.00) -3.82%, rgba(5, 24, 67, 0.50) 98.44%),
    radial-gradient(96.03% 113.39% at 98.65% 96.93%, rgba(175, 196, 151, 0.40) 0%, rgba(21, 148, 194, 0.40) 44.58%, rgba(5, 24, 67, 0.40) 100%),
    #051843
  `,
  accent: '#adfeff',
  iconBackground: '#1F588A',
  bright: '#ddf4ff',
  full: '#4092d6',
};

export const createAiGovernanceContent = (
  applicationUrlWithUtm: string,
  courseSlug: string,
): CourseLanderContent => ({
  meta: {
    title: 'AI Governance Course | BlueDot Impact',
    description: 'A 25-hour course for people ready to stop watching and start shaping how AI is governed. Learn the governance landscape, major proposals, and build your path into AI policy.',
  },

  sectionNav: [
    { id: 'personas', label: 'Who it\'s for' },
    { id: 'outcomes', label: 'What you\'re joining' },
    { id: 'pathways', label: 'Careers' },
    { id: 'structure', label: 'How it works' },
    { id: 'faq', label: 'FAQ' },
  ],

  hero: {
    categoryLabel: 'COHORT-BASED COURSE',
    title: 'AI Governance',
    description: 'Governments are making decisions about AI. They don\'t have enough people who get it. You could be one of them.',
    primaryCta: {
      text: 'Join the next cohort',
      url: applicationUrlWithUtm,
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: `/courses/${courseSlug}/1/1`,
    },
    imageSrc: '/images/lander/ai-governance/hero-graphic.png',
    imageAlt: 'AI Governance visualization',
    gradient: AI_GOVERNANCE_COLORS.gradient,
    accentColor: AI_GOVERNANCE_COLORS.accent,
    imageAspectRatio: '1408/1122',
  },

  // Use default GraduateSection (no alumniLogos specified)

  personas: {
    title: 'Who this course is for',
    accentColor: AI_GOVERNANCE_COLORS.iconBackground,
    defaultExpandedIndex: -1,
    personas: [
      {
        icon: PiCode,
        title: 'Technical people considering governance',
        summary: 'You get the tech. Now you want to know if policy is where you should point it.',
        description: 'You understand the technology - how the systems work, what scaling means, where the risks come from. You\'ve founded a startup, or you\'re a TPM at a major lab. You\'re now considering whether to point those skills at policy. You can translate between technical and policy worlds, but you don\'t know how governance actually works or what the jobs look like.',
        valueProposition: 'People like you have made this move. Engineers from Google, PMs from Anthropic, founders who sold their companies - now at AISI, NIST, GovAI - making sure we safely navigate AGI. Your cohort will include others making the same bet. Many become collaborators or co-workers for years. You\'ll develop the political judgment to match your technical judgment - and know which roles actually have leverage.',
      },
      {
        icon: PiRocketLaunch,
        title: 'High-potential people early in their careers',
        summary: 'You have options. You\'re not the type to drift into a default path.',
        description: 'You\'re at a top university or recently graduated. You\'ve engaged seriously with AI - through our AGI Strategy course, a university group, or your own deep reading. You\'re considering fellowships, law school, maybe a PhD. You know AI governance matters and want to do something - you just don\'t know what the jobs are yet.',
        valueProposition: 'You\'ll join a cohort of others at the same stage - high-potential, high-optionality, figuring out how to make AI go well. Many stay in touch for years - start projects together, join fellowships. You won\'t be figuring this out alone. Alumni from this track have gone on to Horizon, GovAI, AISI, and lab policy teams - many deciding their path during the course.',
      },
      {
        icon: PiScales,
        title: 'Policy professionals adding AI expertise',
        summary: 'You know how policy works. AI is eating your field and you need to specialize.',
        description: 'You already work in government, a think tank, or policy - you know how institutions work. But AI is reshaping everything and you\'re not content to watch from the sidelines. You want to become the person your org turns to on AI - or make a bigger move entirely.',
        valueProposition: 'You\'ll become the person your org turns to on AI - not just someone who\'s "interested in tech policy." Fluent in the debates, credible when technical claims come up, and positioned to lead on it.',
      },
    ],
  },

  courseOutcomes: {
    title: 'What you\'ll be part of',
    accentColor: AI_GOVERNANCE_COLORS.iconBackground,
    outcomes: [
      {
        icon: PiMapTrifold,
        title: 'The governance landscape',
        description: 'How decisions actually get made. Who has power. Which agencies and actors matter. How policy goes from idea to implementation. The factions and debates you need to know.',
      },
      {
        icon: PiBookOpen,
        title: 'Fluency in major proposals',
        description: 'Compute governance, safety standards, liability frameworks, international coordination. What\'s being proposed, by whom, and why. The arguments for and against. Enough depth to form your own views.',
      },
      {
        icon: PiLightbulb,
        title: 'Judgment on new proposals',
        description: 'Frameworks for evaluating ideas you haven\'t seen before. What makes something tractable? Who supports or opposes it? Where\'s the leverage? You\'ll develop taste, not just knowledge.',
      },
      {
        icon: PiPath,
        title: 'Clarity on your path',
        description: 'Is governance right for you? If yes, what specifically? By the end, you\'ll have a concrete plan - and the expectation that you\'ll act on it.',
      },
      {
        icon: PiUsersThree,
        title: 'A network you don\'t yet have',
        description: 'Your cohort of 8 becomes your group chat. The round of 100 your first network. The facilitator works in the field, so do guest speakers. You\'ll leave knowing people you can call on.',
      },
    ],
  },

  courseInformation: {
    title: 'How it works',
    applicationUrl: applicationUrlWithUtm,
    scheduleCtaText: 'Join the next cohort',
    courseSlug,
    accentColor: AI_GOVERNANCE_COLORS.full,
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
            <span className="text-bluedot-navy/60">We're selective. If you're here to add a credential, this isn't for you.</span>
          </>
        ),
      },
      {
        icon: PiClockClockwise,
        label: 'Time',
        description: '~25 hours total',
      },
      {
        icon: PiChats,
        label: 'Format',
        description: (
          <>
            <span className="font-semibold">2-3 hours</span> readings, reflections and exercises per unit
            <br />
            <span className="font-semibold">2-hours live discussion</span> with your cohort of 7-9 per unit
            <br />
            Facilitated by someone working in AI governance
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
            <span className="font-semibold">INTENSIVE:</span> 5 days, ~5h/day
            <br />
            <span className="font-semibold">PART-TIME:</span> 5 weeks, ~5h/week
          </>
        ),
      },
    ],
  },

  pathways: {
    title: 'What happens after',
    pathways: [
      {
        icon: PiBank,
        title: 'Government roles',
        description: 'AISI, NIST, OSTP, congressional staff, state-level policy. We\'ll help you understand what exists and connect you to people who can help.',
        accentColor: AI_GOVERNANCE_COLORS.iconBackground,
      },
      {
        icon: PiGraduationCap,
        title: 'Fellowships',
        description: 'Horizon, GovAI, IAPS, TechCongress. This course will prepare you to be competitive.',
        accentColor: AI_GOVERNANCE_COLORS.iconBackground,
      },
      {
        icon: PiHandshake,
        title: 'Policy organizations',
        description: 'Think tanks, advocacy orgs, AI company policy teams. Many people find their calling - and highest impact - here.',
        accentColor: AI_GOVERNANCE_COLORS.iconBackground,
      },
      {
        icon: PiBriefcase,
        title: 'Specializing where you are',
        description: 'For policy professionals, the goal might not be about moving orgs but becoming the AI lead in your current context.',
        accentColor: AI_GOVERNANCE_COLORS.iconBackground,
      },
    ],
  },

  faq: {
    title: 'FAQ',
    items: [
      {
        id: 'what-is-ai-governance',
        question: 'What do we mean by AI Governance?',
        answer: 'Not corporate AI ethics committees or responsible AI checklists. We mean the governance of frontier AI and AGI - the policy, coordination, and institutional decisions that will shape whether advanced AI goes well.\n\nAI governance - in the view of this course - is the practice of shaping how AI is built and deployed through policy, institutions, norms, and relationships. It requires both analytical judgment (what interventions would actually work?) and political judgment (what\'s achievable, and how do you help make it happen?). This still-young field has many disagreements over goals and methods - which makes it even more important to evaluate proposals rigorously and build the influence to move the ones you believe in. That\'s where our course starts.',
      },
      {
        id: 'technical-background',
        question: 'Do I need a technical background?',
        answer: 'You need to understand AI well enough to engage - but that\'s about understanding, not credentials. Some of the best people in governance came from policy, law, or other fields but did the work to understand the technology.',
      },
      {
        id: 'policy-professional',
        question: 'I already work in policy. Is this for me?',
        answer: 'Yes - if you want to specialize in AI policy with a focus on making AI go well.',
      },
      {
        id: 'early-career',
        question: 'I\'m early in my career. Is this too advanced?',
        answer: 'If you\'ve done AGI Strategy (or equivalent) and can engage with AI capabilities and risks, you\'re ready. Many participants are early-career.',
      },
      {
        id: 'us-focused',
        question: 'Is this US-focused?',
        answer: 'In part as we believe the US is where most leverage is right now. Though, we also cover other jurisdictions and higher-level proposals.',
      },
      {
        id: 'vs-fellowships',
        question: 'How is this different from fellowships like Horizon or IAPS?',
        answer: 'Lower commitment (25 hours vs full-time for months). We\'re often upstream of those programs - the course helps you decide, and if you want to pursue fellowships, we can help you get there.',
      },
      {
        id: 'time-commitment',
        question: 'What\'s the time commitment really?',
        answer: '~5 hours per unit. Intensive is one full week. Take some time off and lock in. Part-time spreads it over five weeks. Most people do it alongside work or school.',
      },
    ],
  },

  banner: {
    title: (<>We're looking for people who are ready to move -<br />not just learn</>),
    ctaText: 'Join the next cohort',
    ctaUrl: applicationUrlWithUtm,
    imageSrc: '/images/lander/ai-governance/hero-banner-split.webp',
    imageAlt: 'AI Governance banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.webp',
  },
});
