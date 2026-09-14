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
    description: 'A 40-hour online course to build your judgment on frontier AI governance. Assess evidence, compare strategies, and plan how you can contribute. No previous BlueDot course required.',
  },

  hero: {
    categoryLabel: 'COHORT-BASED COURSE',
    title: 'Frontier AI Governance',
    description: 'Build the judgment to help shape how frontier AI is governed. Assess evidence, compare competing strategies, and test your ideas through practical exercises and discussion. Leave with a concrete plan for how you can contribute.',
    quickFacts: 'Online · 40 hours · Intensive or part-time · Free',
    primaryCta: {
      text: 'Apply now',
      url: applicationUrlWithUtm,
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: '#curriculum',
    },
    imageSrc: '/images/lander/ai-governance/hero-graphic.png',
    imageAlt: 'Frontier AI Governance visualization',
    gradient: AI_GOVERNANCE_COLORS.gradient,
    accentColor: AI_GOVERNANCE_COLORS.accent,
    imageAspectRatio: '1408/1122',
  },

  hideTestimonials: true,
  graduateLabel: 'BlueDot alumni work at',
  courseInformationHeadingVariant: 'compact',

  whoIsThisForText: {
    id: 'personas',
    title: 'Who this course is for',
    items: [
      {
        heading: 'Technical people exploring governance',
        body: 'You work with AI as an engineer, researcher, product manager, or founder, and want to understand how your technical skills could inform policy and institutional decisions.',
      },
      {
        heading: 'Professionals with institutional experience',
        body: 'You work in policy, law, national security, economics, diplomacy, journalism, or a related field, and want to bring informed judgment on frontier AI to your work.',
      },
      {
        heading: 'People considering their next step',
        body: 'You are exploring research, fellowships, further study, or a career in AI governance, and want to test your interest through substantive work and discussion.',
      },
    ],
  },

  courseOutcomes: {
    id: 'curriculum',
    title: 'What you\'ll actually do',
    accentColor: AI_GOVERNANCE_COLORS.iconBackground,
    headingVariant: 'compact',
    outcomes: [
      {
        icon: PiBookOpen,
        title: 'Unit 1: Assess frontier AI evidence',
        description: (
          <>
            Read selected system-card sections alongside independent evaluations. Write briefings for decision-makers and take part in a simulated oversight board.
          </>
        ),
        linkUrl: `/courses/${courseSlug}/1/1`,
        linkText: 'View Unit 1',
      },
      {
        icon: PiMapTrifold,
        title: 'Unit 2: Map institutions and power',
        description: 'Map who can act on frontier AI, where their power depends on others, and where institutional gaps or policy windows create opportunities.',
        linkUrl: `/courses/${courseSlug}/2/1`,
        linkText: 'View Unit 2',
      },
      {
        icon: PiHandshake,
        title: 'Unit 3: Compare governance strategies',
        description: 'Compare competing approaches to governing frontier AI. Reconstruct arguments you disagree with and examine what would change your view.',
        linkUrl: `/courses/${courseSlug}/3/1`,
        linkText: 'View Unit 3',
      },
      {
        icon: PiBank,
        title: 'Unit 4: Test proposals under pressure',
        description: 'Stress-test governance ideas against accelerating capabilities, competition between labs and states, and the concentration of power.',
        linkUrl: `/courses/${courseSlug}/4/1`,
        linkText: 'View Unit 4',
      },
      {
        icon: PiLightbulb,
        title: 'Unit 5: Defend a position',
        description: 'Your group chooses one debate: open-weight models or restraining frontier AI development. Read competing arguments, write a position, and defend it in discussion.',
        linkUrl: `/courses/${courseSlug}/5/1`,
        linkText: 'View Unit 5',
      },
      {
        icon: PiPath,
        title: 'Unit 6: Plan your contribution',
        description: 'Assess your skills and opportunities. Get peer feedback on a concrete 30-day action and a six-month plan for contributing to AI governance.',
        linkUrl: `/courses/${courseSlug}/6/1`,
        linkText: 'View Unit 6',
      },
    ],
  },

  scheduleList: {
    title: 'Dates and format',
    intro: 'Choose a six-day intensive or a six-week part-time cohort. Both cover the same material: around 6–7 hours per day or week, including preparation and live discussion.',
    courseSlug,
    applicationUrl: applicationUrlWithUtm,
    hoursPerUnit: '6–7',
    fallbackText: 'Check the application form for upcoming cohorts.',
    fallbackCtaText: 'Apply now',
  },

  courseBenefitsTextPlacement: 'afterStructure',
  courseBenefitsText: {
    id: 'support',
    title: 'After the course',
    paragraphs: [
      'Join the wider BlueDot alumni community to exchange ideas, find collaborators, and hear about jobs and fellowships. Use your course roadmap to choose your next step, whether that means research, a policy role, further study, or a project of your own.',
      (
        <>
          Where relevant, explore BlueDot&apos;s
          {' '}
          <a href="/grants/rapid" className={externalLinkClassName}>Rapid Grants</a>
          {' '}
          and
          {' '}
          <a href="/grants/career-transition" className={externalLinkClassName}>Career Transition Grants</a>
          . Interested in teaching? See
          {' '}
          <a href="/facilitate" className={externalLinkClassName}>facilitation opportunities</a>
          .
        </>
      ),
    ],
  },

  faq: {
    title: 'FAQ',
    items: [
      {
        id: 'corporate-ai-governance',
        question: 'Is this corporate AI governance or AI ethics?',
        answer: 'The focus is frontier AI and AGI: the policy, coordination, and institutional decisions that shape the development and deployment of increasingly capable AI. It is not a course on corporate compliance or internal AI-use policies.',
      },
      {
        id: 'prior-experience',
        question: 'Do I need a previous BlueDot course or a technical background?',
        answer: 'No previous BlueDot course or technical qualification is required. Some familiarity with AI capabilities and risks will help. Come ready to read critically, write, and defend and revise your views.',
      },
      {
        id: 'us-focused',
        question: 'Which countries does the course cover?',
        answer: 'The course draws heavily on US examples, alongside the UK, EU, China, and international coordination. You will examine how institutions and political context affect what can work in different jurisdictions.',
      },
      {
        id: 'discussion-times',
        question: 'When are the live discussions?',
        answer: 'We run discussions across a range of time zones. You will share your availability so we can match you with a group. Choose a cohort whose dates work for you, and allow time to complete the readings and exercises before each discussion.',
      },
      {
        id: 'vs-fellowships',
        question: 'How is this different from fellowships in the field?',
        answer: 'This is a 40-hour course built around readings, exercises, and facilitated discussion. It can help you explore your direction and prepare for further work in the field. It does not include a full-time research placement.',
      },
    ],
  },

  banner: {
    title: 'Help shape how frontier AI is governed.',
    ctaText: 'Apply now',
    ctaUrl: applicationUrlWithUtm,
    imageSrc: '/images/lander/ai-governance/hero-banner-split.webp',
    imageAlt: 'Frontier AI Governance banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.webp',
  },
});
