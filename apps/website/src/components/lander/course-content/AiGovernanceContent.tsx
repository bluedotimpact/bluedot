import {
  PiBank,
  PiBookOpen,
  PiHandshake,
  PiLightbulb,
  PiMapTrifold,
  PiPath,
} from 'react-icons/pi';
import { type CourseLanderContent } from '../CourseLander';
import { COURSE_COLORS } from '../../../lib/courseColors';

const externalLinkClassName = 'font-medium underline underline-offset-2 hover:text-bluedot-normal';

export const AI_GOVERNANCE_COLORS = COURSE_COLORS['ai-governance'];

export const createAiGovernanceContent = (
  applicationUrlWithUtm: string,
  courseSlug: string,
): CourseLanderContent => ({
  meta: {
    title: 'Frontier AI Governance Course | BlueDot Impact',
    description: 'A ~30-hour cohort course for people ready to help governments and institutions make better decisions about frontier AI and AGI.',
  },

  hero: {
    categoryLabel: 'COHORT-BASED COURSE',
    title: 'Frontier AI Governance',
    description: 'Governments are making decisions about AI. They don\'t have enough people who get it. You could be one of them.',
    primaryCta: {
      text: 'Apply by 10 May',
      url: applicationUrlWithUtm,
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: `/courses/${courseSlug}/1/1`,
    },
    imageSrc: '/images/lander/ai-governance/hero-graphic.png',
    imageAlt: 'Frontier AI Governance visualization',
    gradient: AI_GOVERNANCE_COLORS.gradient,
    accentColor: AI_GOVERNANCE_COLORS.accent,
    imageAspectRatio: '1408/1122',
  },

  hideTestimonials: true,
  courseInformationHeadingVariant: 'compact',

  whoIsThisForText: {
    id: 'personas',
    title: 'Who this course is for',
    items: [
      {
        heading: 'Technical people considering governance',
        body: (
          <>
            You understand how these systems work - you&apos;ve built, shipped, or founded. You&apos;re considering whether to point those skills at policy. Engineers, PMs, and founders have made this move and now sit at AISI, NIST, GovAI, and lab policy teams. You&apos;ll leave with the political judgment to match the technical, and a clear read on which roles have leverage.
          </>
        ),
      },
      {
        heading: 'Serious early-career people',
        body: 'You\'ve engaged seriously with AI - through our AGI Strategy course, a university group, or your own reading - and you\'re weighing fellowships, grad school, law school, or roles you haven\'t fully mapped. Alumni from this track have gone to Horizon, GovAI, AISI, and lab policy teams; many decided their path during the course. The cohort becomes a network that outlasts it.',
      },
      {
        heading: 'Professionals with institutional knowledge',
        body: 'You have a career - policy, national security, economics, law, diplomacy, intelligence, journalism, finance - and you can see AI is about to reshape it, and everything else too. Your goal isn\'t to switch fields. It\'s to become the person your beat, your agency, your country turns to on the risks and opportunities of AGI.',
      },
    ],
  },

  courseBenefitsText: {
    id: 'support',
    title: 'How BlueDot supports you beyond the course',
    paragraphs: [
      (
        <>
          FAIGC is one course in a wider BlueDot pipeline. During the course, we learn enough about participants to point them toward what makes sense next. Outside BlueDot, that often means introductions - to hiring managers at AI safety organisations or fellowship leads. Inside BlueDot, it means our other programs:
          {' '}
          <a href="/programs/advising" className={externalLinkClassName}>1-1 advising</a>
          ,
          {' '}
          <a href="/programs/rapid-grants" className={externalLinkClassName}>Rapid Grants</a>
          {' '}
          for concrete projects,
          {' '}
          <a href="/programs/career-transition-grant" className={externalLinkClassName}>Career Transition Grants</a>
          {' '}
          for full-time pivots,
          {' '}
          <a href="/programs/incubator-week" className={externalLinkClassName}>Incubator Week</a>
          {' '}
          for founders, or the
          {' '}
          <a href="/courses/technical-ai-safety-project" className={externalLinkClassName}>Technical AI Safety Project Sprint</a>
          {' '}
          for technical builders.
        </>
      ),
      (
        <>
          The
          {' '}
          <a href="/courses/agi-strategy" className={externalLinkClassName}>AGI Strategy Course</a>
          {' '}
          is the upstream prerequisite; jurisdiction- and domain-specific courses are in development. About 8,000 alumni are in our Slack - job openings and policy debates come through daily.
        </>
      ),
    ],
  },

  pathwaysList: {
    title: 'Where alumni go',
    items: [
      {
        title: 'Build something new',
        summary: 'Some come out of the course ready to launch: a project, organisation, or research bet. We back policy entrepreneurs.',
      },
      {
        title: 'Fellowships',
        summary: 'Horizon, GovAI, IAPS, TechCongress, and the strategy streams of MATS and Astra are the obvious next steps. We are often upstream; alumni from earlier cohorts have placed into all of these.',
      },
      {
        title: 'Government and policy roles',
        summary: 'AISI, NIST/CAISI, OSTP, congressional offices, the EU AI Office, OECD, UN, and frontier lab policy teams (Anthropic, OpenAI, Google DeepMind) all need technical fluency plus political judgment.',
      },
      {
        title: 'Research and analysis',
        summary: 'AI governance has a real think-and-do tank community. Many graduates work at RAND, CSET, IfP, IAPS, and CLTR.',
      },
    ],
  },

  courseOutcomes: {
    title: 'What you\'ll actually do',
    accentColor: AI_GOVERNANCE_COLORS.iconBackground,
    headingVariant: 'compact',
    outcomes: [
      {
        icon: PiBookOpen,
        title: 'Unit 1: Read models like a policymaker',
        description: (
          <>
            Read a full system card alongside METR and Epoch evaluations; produce policy briefings tailored to a specific decision-maker.
          </>
        ),
        linkUrl: `/courses/${courseSlug}/1/1`,
        linkText: 'View Unit 1',
      },
      {
        icon: PiMapTrifold,
        title: 'Unit 2: Map power',
        description: 'Map who has power over frontier AI - labs, governments, international bodies - and where the gaps are, including how other actors approach AI risk.',
        linkUrl: `/courses/${courseSlug}/2/1`,
        linkText: 'View Unit 2',
      },
      {
        icon: PiHandshake,
        title: 'Unit 3: Stress-test proposals',
        description: 'Survey compute governance, safety standards, liability, and international coordination. Argue for and against proposals you didn\'t choose.',
        linkUrl: `/courses/${courseSlug}/3/1`,
        linkText: 'View Unit 3',
      },
      {
        icon: PiBank,
        title: 'Unit 4: Govern under pressure',
        description: 'This is the unit most governance courses don\'t have. Examine competitive dynamics between labs and states, power concentration, and governance as capabilities approach and exceed human-level.',
        linkUrl: `/courses/${courseSlug}/4/1`,
        linkText: 'View Unit 4',
      },
      {
        icon: PiLightbulb,
        title: 'Unit 5: Take a side',
        description: 'Pick a live debate - open-weight models, whether frontier development should be slowed, and more. Read across the spectrum, then defend a position in writing.',
        linkUrl: `/courses/${courseSlug}/5/1`,
        linkText: 'View Unit 5',
      },
      {
        icon: PiPath,
        title: 'Unit 6: Make your roadmap',
        description: 'Audit your skills, network, and comparative advantage. Produce a 6-month roadmap, with the expectation you\'ll act on it.',
        linkUrl: `/courses/${courseSlug}/6/1`,
        linkText: 'View Unit 6',
      },
    ],
  },
  courseOutcomesPlacement: 'beforeStructure',

  scheduleList: {
    title: 'Schedule',
    intro: 'Intensive cohorts run for 6 days at ~5h/day. Part-time cohorts run for 6 weeks at ~5h/week. Apply by the deadline listed below.',
    courseSlug,
    applicationUrl: applicationUrlWithUtm,
    fallbackText: 'Intensive starts 18 May, 8 Jun, and 22 Jun. Part-time starts 8 Jun and 20 Jul. Apply by the deadline listed below.',
    fallbackCtaText: 'Apply by 10 May',
  },

  fieldBuilding: {
    title: 'Help build the field',
    intro: 'We also hire Adjunct Experts and Facilitators (~5h/week) and Fellow-Researchers (20-30h/week) to teach.',
    headingVariant: 'compact',
    roles: [
      {
        title: 'Adjunct Experts and Facilitators',
        description: 'Work with a cohort for about 5 hours per week: lead discussions, bring current AI governance judgment, and help participants find their next step.',
        linkUrl: '/facilitate',
        linkText: 'Apply',
      },
      {
        title: 'Fellow-Researchers',
        description: 'Teach while continuing governance research or field-building work, typically 20-30 hours per week.',
        linkUrl: '/facilitate',
        linkText: 'Apply',
      },
    ],
  },

  faq: {
    title: 'FAQ',
    items: [
      {
        id: 'corporate-ai-governance',
        question: 'Is this corporate AI governance or AI ethics?',
        answer: 'No. We mean frontier AI and AGI - the policy, coordination, and institutional decisions that shape whether advanced AI goes well.',
      },
      {
        id: 'technical-background',
        question: 'Do I need a technical background?',
        answer: 'No - but you need to engage with the technology seriously enough to assess capability claims. AGI Strategy or equivalent is the bar.',
      },
      {
        id: 'us-focused',
        question: 'Is this US-focused?',
        answer: 'In part. The US is where we think much of the current leverage is. We also cover the EU, UK, China, and international coordination to a smaller extent.',
      },
      {
        id: 'vs-fellowships',
        question: 'How is this different from fellowships in the field?',
        answer: 'Lower commitment (~30 hours vs months full-time). We\'re often upstream - the course helps you decide which fellowships to pursue, and we help you get there.',
      },
    ],
  },

  banner: {
    title: 'Governments need people who get AI.',
    ctaText: 'Apply by 10 May',
    ctaUrl: applicationUrlWithUtm,
    imageSrc: '/images/lander/ai-governance/hero-banner-split.webp',
    imageAlt: 'Frontier AI Governance banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.webp',
  },
});
