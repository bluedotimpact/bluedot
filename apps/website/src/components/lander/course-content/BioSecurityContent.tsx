import {
  PiBriefcase,
  PiCompass,
  PiFlask,
  PiHandCoins,
  PiRocketLaunch,
  PiUsersThree,
} from 'react-icons/pi';
import { type CourseLanderContent } from '../CourseLander';
import { BIOSECURITY_COLORS } from '../../../lib/courseColors';

export const createBioSecurityContent = (
  applicationUrlWithUtm: string,
  courseSlug: string,
): CourseLanderContent => ({
  meta: {
    title: 'Biosecurity Course | BlueDot Impact',
    description: 'Start building towards a pandemic-proof world. Join our intensive course to prevent, detect and respond to pandemic threats.',
  },

  hero: {
    gradient: BIOSECURITY_COLORS.gradient,
    accentColor: BIOSECURITY_COLORS.accent,
    categoryLabelColor: BIOSECURITY_COLORS.categoryLabel,
    categoryLabel: 'COHORT-BASED COURSE',
    title: 'Biosecurity',
    description: 'Start building towards a pandemic-proof world.\n\nUnderstand efforts to prevent, detect and respond to pandemic threats. Identify where you can contribute. All in 30 hours.',
    primaryCta: {
      text: 'Apply now',
      url: applicationUrlWithUtm,
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: `/courses/${courseSlug}/1/1`,
    },
    imageSrc: '/images/lander/biosecurity/hero-graphic.png',
    imageAlt: 'Biosecurity visualization',
    imageAspectRatio: '1408/1122',
  },

  whoIsThisFor: {
    iconBackgroundColor: BIOSECURITY_COLORS.iconBackground,
    title: 'Who this course is for',
    targetAudiences: [
      {
        icon: PiFlask,
        boldText: 'Engineers and scientists',
        description: 'who want to defend against pandemics.',
      },
      {
        icon: PiBriefcase,
        boldText: 'Policy professionals',
        description: 'who want to contribute to biosecurity policy.',
      },
      {
        icon: PiCompass,
        boldText: 'Entrepreneurs',
        description: 'who want to build new pandemic defences.',
      },
    ],
    bottomCta: {
      boldText: 'Don\'t fit these perfectly? Apply anyway.',
      text: 'Some of our most impactful participants have included teachers, policymakers, engineers, and community leaders. We bet on drive and ambition, not CVs.',
      buttonText: 'Apply now',
      buttonUrl: applicationUrlWithUtm,
    },
  },

  courseBenefitsPlacement: 'beforePathways',

  courseBenefits: {
    title: 'How this course will benefit you',
    iconBackgroundColor: BIOSECURITY_COLORS.bright,
    benefits: [
      {
        icon: PiRocketLaunch,
        title: 'Take action in less than 30 hours',
        description: 'Skip months of scattered reading. This course gives you a structured overview of efforts to prevent, detect and respond to pandemics. Understand what works, what fails, and where the gaps are.',
      },
      {
        icon: PiUsersThree,
        title: 'Join a network of builders',
        description: 'We\'re building a community of people who are energised to take ambitious actions to build a pandemic-proof world, including starting new companies, policy entrepreneurship, and high-impact research bets. Completing this course will give you access to this community.',
      },
      {
        icon: PiHandCoins,
        title: 'Get funded to accelerate your impact',
        description: 'From small grants to build your portfolio, up to £50k to launch new organisations. We\'ll do whatever it takes to accelerate your journey.',
      },
    ],
  },

  scheduleList: {
    title: 'Schedule',
    courseSlug,
    applicationUrl: applicationUrlWithUtm,
  },

  testimonialsTitle: 'Meet our alumni working on biosecurity',
  testimonialsHideQuotes: true,

  pathwaysList: {
    title: 'What happens after',
    intro: 'This course is where you get oriented. What comes next depends on you.',
    items: [
      {
        title: 'Rapid Grants',
        summary: 'Small, fast funding for concrete biosecurity work. Five-minute application, decisions in days, money upfront by default.',
        href: '/programs/rapid-grants',
        ctaLabel: 'Explore program',
      },
      {
        title: 'Career Transition Grants',
        summary: 'Funding to enable you to work full-time on impactful biosecurity work. Propose your plan and we\'ll back you.',
        href: '/programs/career-transition-grant',
        ctaLabel: 'Explore program',
      },
    ],
  },

  quotes: {
    variant: 'editorial',
    accentColor: BIOSECURITY_COLORS.full,
    quotes: [
      {
        quote: '"COVID-19 has been very severe … it has affected every corner of this planet. But this is not necessarily the big one."',
        name: 'Dr Michael Ryan',
        role: 'Former Executive Director, WHO Health Emergencies Programme',
        imageSrc: '/images/lander/biosecurity/michael-ryan.webp',
        url: 'https://www.theguardian.com/world/2020/dec/29/who-warns-covid-19-pandemic-is-not-necessarily-the-big-one',
      },
      {
        quote: '"AI will unlock nearly limitless potential in biology. . . . At the same time, it could create new pathways for malicious actors to synthesize harmful pathogens and other biomolecules."',
        name: 'America\'s AI Action Plan',
        role: 'Trump Administration',
        imageSrc: '/images/lander/biosecurity/white-house.webp',
        url: 'https://www.whitehouse.gov/wp-content/uploads/2025/07/Americas-AI-Action-Plan.pdf',
      },
      {
        quote: '"A straightforward extrapolation of today\'s systems to those we expect to see in 2 to 3 years suggests a substantial risk that AI systems will be able to fill in all the missing pieces, enabling many more actors to carry out large-scale biological attacks. We believe this represents a grave threat to U.S. national security."',
        name: 'Dario Amodei',
        role: 'CEO, Anthropic',
        imageSrc: '/images/lander/foai/dario.webp',
        url: 'https://www.congress.gov/event/118th-congress/senate-event/LC72507/text',
      },
      {
        quote: '"We\'re reaching an inflection point with biotechnology where, with the help of AI, we are starting to be able to program cells like we program computers. This inflection point will define our national and economic security in the decades to come."',
        name: 'Michelle Rozo',
        role: 'Vice-Chair, National Security Commission on Emerging Biotechnology',
        imageSrc: '/images/lander/biosecurity/michelle-rozo.webp',
        url: 'https://www.biotech.senate.gov/press-releases/ai-action-plan-a-critical-step-for-aixbio-innovation-national-security-and-global-economic-competitiveness',
      },
    ],
  },

  faq: {
    title: 'Frequently Asked Questions',
    items: [
      {
        id: 'biology-expertise',
        question: 'How much biology expertise do I need?',
        answer: 'None. We\'ll help you build the foundation. The course is designed for serious thinkers from any background. We cover the biology you need as we go.',
      },
      {
        id: 'formats',
        question: 'What\'s the difference between intensive and part-time?',
        answer: 'Same content, different pace. Intensive is ~6 days at ~5h/day, for people who can clear a week and want to move fast. Part-time is ~6 weeks at ~5h/week, for people fitting this around other commitments. Both end in the same place.',
      },
      {
        id: 'funding',
        question: 'Is there funding available?',
        answer: (
          <>
            Yes. Funding is available to graduates of the course. See <a href="/programs" className="underline">bluedot.org/programs</a> for current grants and how to apply.
          </>
        ),
        answerText: 'Yes. Funding is available to graduates of the course. See bluedot.org/programs for current grants and how to apply.',
      },
      {
        id: 'bluedot',
        question: 'Who is BlueDot Impact?',
        answer: 'BlueDot is the leading talent accelerator for beneficial AI and societal resilience. We run cohort-based courses, help people land jobs, organise events around the world, and back people starting new organisations. Biosecurity is one of three programmes alongside AI safety and AI governance. We\'ve trained thousands of people since 2022, and our biosecurity alumni now work on pandemic preparedness at organisations around the world.',
      },
    ],
  },

  banner: {
    title: 'Start building a pandemic-proof world today',
    ctaText: 'Apply now',
    ctaUrl: applicationUrlWithUtm,
    imageSrc: '/images/lander/agi-strategy/hero-banner-split.webp',
    imageAlt: 'Biosecurity banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.webp',
  },
});
