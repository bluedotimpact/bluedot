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
    description: 'A ~30-hour course for people ready to stop watching and start shaping how AI is governed. Learn the governance landscape, pressure-test major proposals, and build your path into AI policy.',
  },

  sectionNav: [
    { id: 'personas', label: 'Who it\'s for' },
    { id: 'pathways', label: 'Careers' },
    { id: 'outcomes', label: 'What you\'ll do' },
    { id: 'structure', label: 'How it works' },
    { id: 'help-build-field', label: 'Teach with us' },
    { id: 'faq', label: 'FAQ' },
  ],

  hero: {
    categoryLabel: 'COHORT-BASED COURSE',
    title: 'Frontier AI Governance',
    description: 'Governments are making decisions about AI, and those decisions are only getting harder as capabilities advance. They don\'t have enough people who get it. You could be one of them.',
    primaryCta: {
      text: 'Join the next cohort',
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

  // Use default GraduateSection (no alumniLogos specified)
  testimonialsPlacement: 'beforeOutcomes',

  personas: {
    title: 'Who this course is for',
    accentColor: AI_GOVERNANCE_COLORS.iconBackground,
    defaultExpandedIndex: -1,
    personas: [
      {
        icon: PiCode,
        title: 'Technical people considering governance',
        summary: 'You get the tech. Now you want to know if policy is where you should point it.',
        description: 'You understand the technology - how the systems work, what scaling means, where the risks come from. Maybe you\'ve built systems, shipped products, worked at or started companies in AI. You\'re now considering whether to point those skills at policy. You can translate between technical and policy worlds, but you don\'t know how governance actually works - or what the jobs look like.',
        valueProposition: (
          <>
            People like you have made this move. Engineers from frontier labs, PMs, founders - now at
            {' '}
            <a href="https://www.aisi.gov.uk/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>AISI</a>
            ,
            {' '}
            <a href="https://www.nist.gov/artificial-intelligence-safety-institute" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>NIST</a>
            ,
            {' '}
            <a href="https://www.governance.ai/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>GovAI</a>
            , and lab policy teams, shaping how we navigate AGI. Your cohort will include others making the same bet. Many become collaborators or co-workers for years. You'll develop the political judgment to match your technical judgment - and know which roles actually have leverage.
          </>
        ),
      },
      {
        icon: PiRocketLaunch,
        title: 'High-potential people early in their careers',
        summary: 'You have options. You\'re not the type to drift into a default path.',
        description: 'You\'re at a top university or recently graduated. You\'ve engaged seriously with AI - through our AGI Strategy course, a university group, or your own deep reading. You\'re considering fellowships, graduate school, or roles you haven\'t fully mapped yet. You know AI governance matters and want to do something - you just don\'t know what the jobs are yet.',
        valueProposition: (
          <>
            You'll join a cohort of others at the same stage - high-potential, high-optionality, figuring out how to make AI go well. Alumni from this track have gone on to
            {' '}
            <a href="https://horizonpublicservice.org/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>Horizon</a>
            ,
            {' '}
            <a href="https://www.governance.ai/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>GovAI</a>
            ,
            {' '}
            <a href="https://www.aisi.gov.uk/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>AISI</a>
            , and lab policy teams - many deciding their path during the course. The cohort becomes a professional network that lasts well beyond it. You won't be figuring this out alone.
          </>
        ),
      },
      {
        icon: PiScales,
        title: 'Professionals with institutional knowledge',
        summary: 'You know how institutions work. AI is reshaping everything and you need to lead on it.',
        description: 'You already have a career - in policy, national security, economics, law, diplomacy, intelligence, journalism, finance, or something else entirely - and you can see that AI is going to reshape the world. Maybe you already work in government and want to become the person your agency turns to on frontier AI. Maybe you\'re an economist who sees AI is about to become the most important variable in your models. Maybe you\'re in national security and need to understand what these systems can actually do.',
        valueProposition: 'The common thread: you have judgment and institutional knowledge, and you want to apply it to humanity\'s most important technology. You\'ll leave fluent in the debates, credible when technical claims come up, and with a concrete sense of where your existing expertise has the most leverage.',
      },
    ],
  },

  courseOutcomes: {
    title: 'What you\'ll actually do',
    accentColor: AI_GOVERNANCE_COLORS.iconBackground,
    outcomes: [
      {
        icon: PiBookOpen,
        title: 'Unit 1: From models to briefings',
        description: (
          <>
            You'll read a real system card in full - currently Anthropic's Claude Opus 4.6 - alongside the latest evaluation reports from
            {' '}
            <a href="https://metr.org/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>METR</a>
            {' '}
            and
            {' '}
            <a href="https://epoch.ai/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>Epoch</a>
            . You'll figure out what's actually being claimed versus what's missing or omitted, and produce a policy-relevant briefing tailored to a specific decision-maker. You won't summarize - you'll learn to translate.
          </>
        ),
        linkUrl: `/courses/${courseSlug}/1/1`,
        linkText: 'Go to Unit 1',
      },
      {
        icon: PiMapTrifold,
        title: 'Unit 2: The governance landscape',
        description: 'Who has power over frontier AI development? Where are the dependencies between labs, governments, and international bodies? Where are the gaps? You\'ll map the institutional landscape - including how China approaches AI risk - and develop a working picture of who can actually do what.',
        linkUrl: `/courses/${courseSlug}/2/1`,
        linkText: 'Go to Unit 2',
      },
      {
        icon: PiHandshake,
        title: 'Unit 3: Proposals under pressure',
        description: 'You\'ll survey the governance frameworks actually on the table - compute governance, safety standards, liability, international coordination - and stress-test them. The format is adversarial: you argue for and against proposals you didn\'t choose, surface foundational assumptions, and build the habit of evaluating governance ideas on their merits rather than by who proposed them.',
        linkUrl: `/courses/${courseSlug}/3/1`,
        linkText: 'Go to Unit 3',
      },
      {
        icon: PiBank,
        title: 'Unit 4: Governance in the limit',
        description: 'This is the unit most governance courses don\'t have. Competitive dynamics between labs and between states. The concentration of power in AI systems. What governance looks like as capabilities approach and exceed human-level. You\'ll stress-test your preferred governance approach against the intelligence explosion - break it, redesign it, and name what the redesign costs.',
        linkUrl: `/courses/${courseSlug}/4/1`,
        linkText: 'Go to Unit 4',
      },
      {
        icon: PiLightbulb,
        title: 'Unit 5: Take a stand',
        description: 'You\'ll go deep on one of AI governance\'s live, unresolved debates - currently open-weight models as capabilities increase, and a new track on when, if ever, frontier development should be slowed. You\'ll read the strongest arguments across the spectrum, take a position, and defend it in writing.',
        linkUrl: `/courses/${courseSlug}/5/1`,
        linkText: 'Go to Unit 5',
      },
      {
        icon: PiPath,
        title: 'Unit 6: Your leverage point',
        description: 'Given everything you\'ve learned, what specifically needs to happen - and what are you positioned to do about it? You\'ll audit your skills, network, and comparative advantage, and produce a concrete 6-month roadmap. Not a vague plan. A specific one, with the expectation you\'ll act on it.',
        linkUrl: `/courses/${courseSlug}/6/1`,
        linkText: 'Go to Unit 6',
      },
    ],
  },
  courseOutcomesPlacement: 'beforeStructure',

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
            <span className="text-bluedot-navy/60">We're selective. The course has an acceptance rate of roughly 20-25%.</span>
            <br />
            <span className="text-bluedot-navy/60">We're looking for people who are analytical, motivated, and genuinely considering making this their life's work. If you're here to add a credential, this isn't for you.</span>
            <br />
            <span className="text-bluedot-navy/60">And to be clear: this is not a corporate AI governance or AI ethics course.</span>
          </>
        ),
      },
      {
        icon: PiClockClockwise,
        label: 'Time',
        description: '~30 hours total',
      },
      {
        icon: PiChats,
        label: 'Format',
        description: (
          <>
            <span className="font-semibold">2-3 hours</span> readings, exercises and reflections per unit
            <br />
            <span className="font-semibold">2 hours live discussion</span> with your cohort of 7-9 per unit
            <br />
            Led by a Teaching Fellow working in AI governance
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
            <span className="font-semibold">INTENSIVE:</span> 6 days, ~5h/day
            <br />
            <span className="font-semibold">PART-TIME:</span> 6 weeks, ~5h/week
          </>
        ),
      },
    ],
  },

  pathways: {
    title: 'Where this leads — and how we help',
    intro: (
      <>
        <p className="mb-5">This course doesn&apos;t end at Unit 6. Here&apos;s where our alumni go - and how we help them get there.</p>
        <div className="rounded-2xl border border-bluedot-navy/10 bg-bluedot-navy/[0.03] p-6 md:p-8 text-left">
          <p className="text-size-sm font-semibold leading-[1.4] text-bluedot-navy mb-3">We don&apos;t just teach</p>
          <p className="text-size-sm leading-[1.7] text-bluedot-navy/80">
            BlueDot runs a talent pipeline, not just a course. We actively scout for high-potential participants during the course, facilitate introductions to hiring managers and fellowship leads, and run a
            {' '}
            <a href="/programs/rapid-grants" className={externalLinkClassName}>Rapid Grants program</a>
            {' '}
            to fund participants who come out ready to build something. Our community Slack is where job leads, collaboration opportunities, and policy debates happen daily.
          </p>
        </div>
      </>
    ),
    pathways: [
      {
        icon: PiBank,
        title: 'Government',
        description: (
          <>
            <a href="https://www.aisi.gov.uk/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>AISI</a>
            ,
            {' '}
            <a href="https://www.nist.gov/artificial-intelligence-safety-institute" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>NIST/CAISI</a>
            ,
            {' '}
            <a href="https://www.whitehouse.gov/ostp/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>OSTP</a>
            , congressional offices, state-level policy, international bodies. These are the rooms where AI decisions get made - and most of them are understaffed on frontier AI. We'll help you understand what roles exist, which ones have real leverage, and connect you to people already inside. The career landscape is mapped in detail on Horizon's
            {' '}
            <a href="https://emergingtechpolicy.org/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>Emerging Tech Policy Careers site</a>
            . We recommend it.
          </>
        ),
        accentColor: AI_GOVERNANCE_COLORS.iconBackground,
      },
      {
        icon: PiGraduationCap,
        title: 'Fellowships',
        description: (
          <>
            <a href="https://horizonpublicservice.org/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>Horizon</a>
            ,
            {' '}
            <a href="https://www.governance.ai/post/summer-fellowship-2026-research-track" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>GovAI Summer Fellowship</a>
            ,
            {' '}
            <a href="https://www.iaps.ai/fellowship" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>IAPS</a>
            ,
            {' '}
            <a href="https://techcongress.io/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>TechCongress</a>
            . These are competitive - acceptance rates range from 5-25% - and this course is designed to make you a strong candidate. Several are downstream of us: alumni from earlier cohorts of our governance courses have gone on to all four. If you want a fellowship, we can help you decide which one, and we'll help you get there.
          </>
        ),
        accentColor: AI_GOVERNANCE_COLORS.iconBackground,
      },
      {
        icon: PiHandshake,
        title: 'Frontier lab policy teams',
        description: (
          <>
            <a href="https://www.anthropic.com/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>Anthropic</a>
            ,
            {' '}
            <a href="https://openai.com/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>OpenAI</a>
            ,
            {' '}
            <a href="https://deepmind.google/en/about/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>Google DeepMind</a>
            , and others all have policy, trust &amp; safety, and governance teams. These roles require both technical fluency and political judgment - exactly what this course builds. Alumni work on these teams today.
          </>
        ),
        accentColor: AI_GOVERNANCE_COLORS.iconBackground,
      },
      {
        icon: PiBookOpen,
        title: 'Think tanks and advocacy organizations',
        description: (
          <>
            <a href="https://www.rand.org/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>RAND</a>
            ,
            {' '}
            <a href="https://cset.georgetown.edu/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>CSET</a>
            ,
            {' '}
            <a href="https://ifp.org/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>Institute for Progress</a>
            ,
            {' '}
            <a href="https://www.iaps.ai/" target="_blank" rel="noopener noreferrer" className={externalLinkClassName}>IAPS</a>
            , and others are producing the research and building the arguments that shape legislation and norms. If your strength is analysis and writing, this is where many people find their calling and highest impact.
          </>
        ),
        accentColor: AI_GOVERNANCE_COLORS.iconBackground,
      },
      {
        icon: PiBriefcase,
        title: 'Leading on AI where you already are',
        description: 'Not everyone needs to change organizations. If you\'re already in government, national security, law, economics, or journalism, the goal might be becoming the person your agency or firm turns to on AI. You bring the institutional knowledge; we give you the frontier AI fluency and the network to back it up.',
        accentColor: AI_GOVERNANCE_COLORS.iconBackground,
      },
      {
        icon: PiRocketLaunch,
        title: 'Start something new',
        description: 'Some participants realize the highest-leverage move is to build: a research project, policy initiative, community, tool, or company. That\'s why BlueDot runs Rapid Grants and incubator programming for people who come out ready to launch. Several projects and organizations have roots in our courses.',
        accentColor: AI_GOVERNANCE_COLORS.iconBackground,
      },
    ],
  },

  fieldBuilding: {
    title: 'Help build the field',
    intro: 'We\'re also looking for people to help teach this course - and more broadly, to help build the AI governance talent pipeline.',
    roles: [
      {
        title: 'Adjunct Expert',
        description: 'You work in AI governance - at a think tank, in government, at a frontier lab - and want to teach one cohort while keeping your primary role. ~5 hours per week per cohort. Compensation starts at $50/hour.',
        linkUrl: 'mailto:team@bluedot.org?subject=AI%20Governance%20Teaching%20Fellow',
        linkText: 'Apply as a Teaching Fellow',
      },
      {
        title: 'Fellow-Researcher',
        description: 'You\'re doing independent research, in a fellowship, or building something in the AI governance space, and want to combine that with teaching. A part-time teaching fellowship at 20-30 hours per week.',
        linkUrl: 'mailto:team@bluedot.org?subject=AI%20Governance%20Teaching%20Fellow',
        linkText: 'Apply as a Teaching Fellow',
      },
      {
        title: 'Facilitator',
        description: 'A lighter commitment focused on leading weekly small-group discussions with a cohort of 7-9. Good fit if you work in the field and want to contribute without a larger time commitment.',
        linkUrl: 'mailto:team@bluedot.org?subject=AI%20Governance%20Facilitator',
        linkText: 'Apply as a Facilitator',
      },
    ],
  },

  faq: {
    title: 'FAQ',
    items: [
      {
        id: 'what-is-ai-governance',
        question: 'What do we mean by Frontier AI Governance?',
        answer: 'Not corporate AI ethics committees or responsible AI checklists. We mean the governance of frontier AI and AGI - the policy, coordination, and institutional decisions that will shape whether advanced AI goes well.\n\nAI governance - in the view of this course - is the practice of shaping how AI is built and deployed through policy, institutions, norms, and relationships. It requires both analytical judgment (what interventions would actually work?) and political judgment (what\'s achievable, and how do you help make it happen?). This still-young field has many disagreements over goals and methods - which makes it even more important to evaluate proposals rigorously and build the influence to move the ones you believe in. That\'s where our course starts.',
      },
      {
        id: 'corporate-ai-governance',
        question: 'Is this a corporate AI governance or AI ethics course?',
        answer: 'No. We don\'t mean AI ethics committees or responsible AI checklists. We mean the governance of frontier AI and AGI - the policy, coordination, and institutional decisions that will shape whether advanced AI goes well. This course is about shaping how AI is built and deployed through policy, institutions, norms, and relationships. It requires both analytical judgment - what interventions would actually work? - and political judgment - what\'s achievable, and how do you help make it happen?',
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
        answer: 'Lower commitment (30 hours vs full-time for months). We\'re often upstream of those programs - the course helps you decide, and if you want to pursue fellowships, we can help you get there.',
      },
      {
        id: 'time-commitment',
        question: 'What\'s the time commitment really?',
        answer: '~5 hours per unit. Intensive is a 6-day sprint. Take some time off and lock in. Part-time spreads it over six weeks. Most people do it alongside work or school.',
      },
    ],
  },

  banner: {
    title: 'We\'re looking for people who are ready to move - not just learn.',
    ctaText: 'Join the next cohort',
    ctaUrl: applicationUrlWithUtm,
    imageSrc: '/images/lander/ai-governance/hero-banner-split.webp',
    imageAlt: 'Frontier AI Governance banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.webp',
  },
});
