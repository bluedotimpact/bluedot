import {
  PiArrowsLeftRight,
  PiBank,
  PiBookOpen,
  PiChalkboardTeacherLight,
  PiChats,
  PiClockClockwise,
  PiCode,
  PiFlask,
  PiGraduationCap,
  PiHandHeart,
  PiRocketLaunch,
  PiUsersThree,
} from 'react-icons/pi';
import { type CourseLanderContent } from '../CourseLander';

const externalLinkClassName = 'font-medium underline underline-offset-2 hover:text-bluedot-normal';

export const TAS_COLORS = {
  /* Gradient layers:
     1. Left-side darkness - horizontal gradient to darken left edge for text readability
     2. Bottom-right warm glow - peach → purple → dark purple (from Figma)
     3. Base color - deep purple/magenta */
  gradient: 'linear-gradient(to right, rgba(20, 8, 25, 0.6) 0%, rgba(20, 8, 25, 0.4) 20%, rgba(20, 8, 25, 0.2) 40%, transparent 55%), radial-gradient(130% 160% at 100% 108.81%, rgba(255, 202, 171, 0.40) 0%, rgba(126, 85, 144, 0.40) 52.4%, rgba(46, 16, 54, 0.40) 100%), #2E1036',
  accent: '#E0A5F9',
  iconBackground: '#502869',
  bright: '#ffe9ff',
  mid: '#b880d1',
  full: '#a060bb',
};

export const createTechnicalAiSafetyContent = (
  applicationUrlWithUtm: string,
  courseSlug: string,
): CourseLanderContent => ({
  meta: {
    title: 'Technical AI Safety Course | BlueDot Impact',
    description: 'Start building safer AI. Join our intensive course for builders shaping the future of artificial general intelligence.',
  },

  hero: {
    gradient: TAS_COLORS.gradient,
    accentColor: TAS_COLORS.accent,
    categoryLabel: 'COHORT-BASED COURSE',
    title: 'Technical AI Safety',
    description: 'AI capabilities are advancing faster than our ability to make them safe. The field needs more technical people working on safety, and it needs them now. You could be one of them.',
    primaryCta: {
      text: 'Apply now',
      url: applicationUrlWithUtm,
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: `/courses/${courseSlug}/1/1`,
    },
    imageSrc: '/images/lander/technical-ai-safety/hero-graphic.png',
    imageAlt: 'Technical AI Safety visualization',
    imageAspectRatio: '1408/1122',
  },

  testimonialsPlacement: 'beforeOutcomes',

  personas: {
    title: 'Who this course is for',
    accentColor: TAS_COLORS.iconBackground,
    defaultExpandedIndex: -1,
    footerText: 'Don\'t fit these perfectly? Apply anyway.',
    personas: [
      {
        icon: PiFlask,
        title: 'Researchers',
        summary: 'You know how to do research. Now you want to point it at impactful safety problems.',
        description: 'You have a background in ML, CS, mathematics, or an adjacent field. Maybe you\'re doing a PhD, maybe you\'re at a lab, maybe you\'re publishing already. You understand how models work, but you haven\'t mapped the safety landscape in enough detail to know where your skills would have the most impact. This course gives you that map. You\'ll survey the major open problems in alignment, interpretability, evaluations, and control, and figure out which ones you\'re best positioned to work on.',
      },
      {
        icon: PiCode,
        title: 'Engineers',
        summary: 'You build things. Now you want to scale AI safety.',
        description: 'You\'re a software engineer or technical person. You\'ve shipped products and built large systems. You can see that safety matters, but the field can feel academic and hard to break into from industry. This course is the on-ramp. You\'ll build a working understanding of the technical safety landscape and connect with people who are already doing this work. Many of our alumni have made the move from industry into safety roles at frontier labs and research organisations.',
      },
      {
        icon: PiRocketLaunch,
        title: 'High-potential people early in their careers',
        summary: 'You have options. You\'re not the type to drift into a default path.',
        description: 'You\'re at a top university or recently graduated. You\'ve engaged seriously with AI, through our AGI Strategy course, a university group, or your own deep reading. You\'re considering fellowships, graduate school, or roles you haven\'t fully mapped yet. You know AI safety matters and want to do something. You just don\'t know what the jobs are yet.',
      },
    ],
  },

  pathways: {
    title: 'Where this leads — and how we help',
    intro: (
      <>
        <p className="mb-5">This course doesn&apos;t end at Unit 6. Here&apos;s where our alumni go - and how we help them get there.</p>
        <div className="rounded-2xl border border-bluedot-navy/10 bg-bluedot-navy/[0.03] p-6 md:p-8 text-left">
          <p className="text-[16px] font-semibold leading-[1.4] text-bluedot-navy mb-3">We don&apos;t just teach</p>
          <p className="text-[15px] bd-md:text-[16px] leading-[1.7] text-bluedot-navy/80">
            BlueDot runs a talent pipeline, not just a course. We actively scout for high-potential participants during the course, facilitate introductions to hiring managers and fellowship leads, and run a
            {' '}
            <a href="/programs/rapid-grants" className={externalLinkClassName}>Rapid Grants program</a>
            {' '}
            to fund participants who come out ready to build something. Our community Slack is where job leads, collaboration opportunities, and technical debate happens daily.
          </p>
        </div>
      </>
    ),
    pathways: [
      {
        icon: PiCode,
        title: 'Frontier AI labs',
        description: (
          <>
            <a href="https://www.anthropic.com/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>Anthropic</a>
            ,
            {' '}
            <a href="https://openai.com/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>OpenAI</a>
            ,
            {' '}
            <a href="https://deepmind.google/en/about/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>Google DeepMind</a>
            , and others all have dedicated technical safety teams working on interpretability, evaluations, and alignment. These roles require both deep technical fluency and strategic clarity about which safety problems matter most - exactly what this course builds. Alumni work on these teams today.
          </>
        ),
        accentColor: TAS_COLORS.iconBackground,
      },
      {
        icon: PiGraduationCap,
        title: 'Fellowships',
        description: (
          <>
            <a href="https://www.matsprogram.org/?utm_source=bluedot-impact" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>MATS</a>
            ,
            {' '}
            <a href="https://constellation.org/programs/astra?utm_source=bluedot-impact" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>Astra</a>
            ,
            {' '}
            <a href="https://alignment.anthropic.com/2025/anthropic-fellows-program-2026/?utm_source=bluedot-impact" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>Anthropic Fellows</a>
            ,
            {' '}
            <a href="https://www.lasrlabs.org/?utm_source=bluedot-impact" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>LASR</a>
            ,
            {' '}
            <a href="https://erafellowship.org/fellowship?utm_source=bluedot-impact" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>ERA</a>
            ,
            {' '}
            <a href="https://www.pivotal-research.org/?utm_source=bluedot-impact" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>Pivotal</a>
            ,
            {' '}
            <a href="https://www.arena.education/?utm_source=bluedot-impact" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>ARENA</a>
            ,
            {' '}
            <a href="https://sparai.org/?utm_source=bluedot-impact" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>SPAR</a>
            . These are competitive, and this course is designed to make you a strong candidate. Alumni from our courses have gone on to all of them. If you want a fellowship, we can help you decide which one, and we'll help you get there.
          </>
        ),
        accentColor: TAS_COLORS.iconBackground,
      },
      {
        icon: PiBank,
        title: 'Technical policy',
        description: (
          <>
            <a href="https://www.aisi.gov.uk/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>AISI</a>
            ,
            {' '}
            <a href="https://www.nist.gov/artificial-intelligence-safety-institute" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>NIST</a>
            , and lab policy teams are all hiring people who actually understand the systems being regulated. The people shaping AI policy need technical advisors - and there aren't enough of them. This course builds the technical foundation; you bring it to the policy table.
          </>
        ),
        accentColor: TAS_COLORS.iconBackground,
      },
      {
        icon: PiRocketLaunch,
        title: 'Start something new',
        description: 'Some participants realize the highest-leverage move is to build: a research project, policy initiative, community, tool, or company. That\'s why BlueDot runs Rapid Grants and incubator programming for people who come out ready to launch. Several projects and organizations have roots in our courses.',
        accentColor: TAS_COLORS.iconBackground,
      },
    ],
    callout: (
      <>
        <p className="text-[16px] font-semibold leading-[1.4] text-bluedot-navy mb-3">Technical AI Safety Project Sprint</p>
        <p className="text-[15px] bd-md:text-[16px] leading-[1.7] text-bluedot-navy/80">
          After completing this course, you can apply for our
          {' '}
          <a href="/courses/technical-ai-safety-project" className={externalLinkClassName}>Project Sprint</a>
          : a focused program where you work with an AI safety expert to produce a real contribution to the field. It's how many of our alumni build their first portfolio piece in safety research or engineering.
        </p>
      </>
    ),
  },

  courseBenefits: {
    title: 'What you\'ll actually do',
    iconBackgroundColor: TAS_COLORS.bright,
    benefits: [
      {
        icon: PiChalkboardTeacherLight,
        title: 'Learn from an AI safety expert',
        description: 'Every discussion is led by an AI safety expert. They\'ll answer your technical questions, challenge your assumptions, and connect what you\'re reading to real work happening at labs and research organisations.',
      },
      {
        icon: PiBookOpen,
        title: 'Cover key safety techniques',
        description: 'You\'ll build a working understanding of the major open problems and approaches in technical AI safety, including alignment and RLHF, mechanistic interpretability, evaluations and red-teaming, AI control, and scalable oversight.',
      },
      {
        icon: PiUsersThree,
        title: 'Join a community building towards safety',
        description: 'You\'ll join a curated cohort of people who are serious about making AI go well. Many stay connected long after the course ends, through our community Slack, events, and collaborative projects. This is a network of people starting companies, leading research, and shaping policy in AI safety.',
      },
    ],
  },

  courseInformation: {
    title: 'How the course works',
    applicationUrl: applicationUrlWithUtm,
    scheduleCtaText: 'Apply now',
    courseSlug,
    accentColor: TAS_COLORS.full,
    details: [
      {
        icon: PiArrowsLeftRight,
        label: 'Options',
        description: 'Intensive (~6 days at ~5h/day) or part-time (~6 weeks at ~5h/week). Same content, different pace.',
      },
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
    ],
  },

  scheduleList: {
    title: 'Schedule',
    courseSlug,
    applicationUrl: applicationUrlWithUtm,
  },

  faq: {
    title: 'Frequently Asked Questions',
    items: [
      {
        id: 'technical',
        question: 'How much technical background do I need?',
        answer: (
          <>
            You should understand the basics of how LLMs are trained/fine-tuned, that AI development is driven by data, algorithms and compute, and that the reward function for neural networks is optimised through gradient descent.
            <br /> <br />
            Our 2-hour, self-paced <a href="https://bluedot-impact.notion.site/AI-Foundations-293f8e69035380f29863c4c92c41fac7" target="_blank" rel="noopener noreferrer" className="underline">AI Foundations course</a> will give you enough background.
          </>
        ),
      },
      {
        id: 'agi-strategy',
        question: 'Do I need to take the AGI strategy course first?',
        answer: (
          <>
            It's not required, but strongly recommended. The AGI Strategy course provides essential context that this course builds on. While you can start here directly, you'll get more value if you understand how technical safety fits into the broader landscape of making AI go well.
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
    title: 'Start building towards a good future today',
    ctaText: 'Apply now',
    ctaUrl: applicationUrlWithUtm,
    imageSrc: '/images/lander/agi-strategy/hero-banner-split.webp',
    imageAlt: 'Technical AI Safety banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.webp',
  },
});
