import {
  PiBriefcase,
  PiCompass,
  PiFlask,
  PiGraduationCap,
  PiClockClockwise,
  PiChats,
  PiHandHeart,
  PiCalendarDots,
  PiRocketLaunch,
  PiUsersThree,
  PiHandCoins,
} from 'react-icons/pi';
import Link from 'next/link';
import { CourseLanderContent } from '../CourseLander';

export const TECHNICAL_AI_SAFETY_APPLICATION_URL = 'https://web.miniextensions.com/9YX1i46qewCv5m17v8rl';

export const createTechnicalAiSafetyContent = (
  applicationUrlWithUtm: string,
  courseSlug: string,
): CourseLanderContent => ({
  meta: {
    title: 'Technical AI Safety Course | BlueDot Impact',
    description: 'Start building safer AI. Join our intensive course for builders shaping the future of artificial general intelligence.',
  },

  hero: {
    categoryLabel: 'TECHNICAL AI SAFETY',
    title: 'Start building safer AI',
    description: 'Understand current safety techniques. Map the gaps. Identify where you can contribute. Get funded to start shipping. All in 30 hours.',
    primaryCta: {
      text: 'Apply now',
      url: applicationUrlWithUtm,
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: `/courses/${courseSlug}/1`,
    },
    imageSrc: '/images/lander/technical-ai-safety/hero-banner-split.png',
    imageAlt: 'Technical AI Safety visualization',
  },

  whoIsThisFor: {
    title: 'Who this course is for',
    targetAudiences: [
      {
        icon: PiFlask,
        boldText: 'For ML researchers',
        description: 'who want to take big bets on the most impactful research ideas.',
      },
      {
        icon: PiBriefcase,
        boldText: 'For policy professionals',
        description: 'who need deep technical understanding to build governance solutions.',
      },
      {
        icon: PiCompass,
        boldText: 'For leaders',
        description: 'who want to drive high-impact safety work.',
      },
    ],
  },

  curriculum: {
    title: 'Curriculum Overview',
    courseSlug,
  },

  courseBenefits: {
    title: 'How this course will benefit you',
    benefits: [
      {
        icon: PiRocketLaunch,
        title: 'Take action in less than 30 hours',
        description: "Skip months of scattered reading. This Technical AI Safety course gives you a structured overview of key safety techniques. Understand what works, what fails, and where the gaps are. You'll finish with a fundable plan.",
      },
      {
        icon: PiUsersThree,
        title: 'Join a network of builders',
        description: "This course isn't for everyone. We're building a community of people who are energised to take ambitious actions to make AI go well, including starting new companies, policy entrepreneurship, and high-impact research bets. Completing this course will give you access to this community.",
      },
      {
        icon: PiHandCoins,
        title: 'Get funded to accelerate your impact',
        description: "If your final course proposal is strong, you'll receive $10-50k to kickstart your transition into impactful work, and you'll be invited to co-work with us in London for 1-2 weeks. We'll do whatever it takes to accelerate your journey.",
      },
    ],
  },

  courseInformation: {
    title: 'Course information',
    applicationUrl: applicationUrlWithUtm,
    scheduleCtaText: 'Apply now',
    details: [
      {
        icon: PiGraduationCap,
        label: 'Options',
        description: (
          <>
            <span className="font-semibold">Intensive</span>: 6-day course (5h/day)
            <br />
            <span className="font-semibold">Part-time</span>: 6-week course (5h/week)
          </>
        ),
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
      {
        icon: PiCalendarDots,
        label: 'Schedule',
        description: null,
        isSchedule: true,
        scheduleDescription: (
          <>
            Intensive round starts <span className="font-semibold">3 Nov</span>, application deadline <span className="font-semibold">30 Oct</span>
            <br />
            Part-time round starts <span className="font-semibold">17 Nov</span>, application deadline <span className="font-semibold">9 Nov</span>
          </>
        ),
      },
    ],
  },

  quotes: {
    quotes: [
      {
        quote: '"We should not underestimate the real threats coming from AI [while] we have a narrowing window of opportunity to guide this technology responsibly."',
        name: 'Ursula von der Leyen',
        role: 'President, European Commission',
        imageSrc: '/images/agi-strategy/ursula.png',
        url: 'https://neighbourhood-enlargement.ec.europa.eu/news/2023-state-union-address-president-von-der-leyen-2023-09-13_en',
      },
      {
        quote: '"I\'ve always thought of AI as the most profound technology humanity is working on. More profound than fire or electricity or anything that we\'ve done in the past… The downside is, at some point, that humanity loses control of the technology it\'s developing."',
        name: 'Sundar Pichai',
        role: 'CEO, Google',
        imageSrc: '/images/agi-strategy/sundar.jpg',
        url: 'https://garrisonlovely.substack.com/p/a-compilation-of-tech-executives',
      },
      {
        quote: '"AI could surpass almost all humans at almost everything shortly after 2027."',
        name: 'Dario Amodei',
        role: 'CEO, Anthropic',
        imageSrc: '/images/lander/foai/dario.jpeg',
        url: 'https://arstechnica.com/ai/2025/01/anthropic-chief-says-ai-could-surpass-almost-all-humans-at-almost-everything-shortly-after-2027/',
      },
      {
        quote: '"I\'m all in favor of accelerating technological progress, but there is something unsettling about the way OpenAI explicitly declares its mission to be the creation of AGI. [...] To the extent the mission produces extra motivation for the team to ship good products, it\'s a positive. To the extent it might actually succeed, it\'s a reason for concern."',
        name: 'David Sacks',
        role: 'White House AI and Crypto Czar',
        imageSrc: '/images/agi-strategy/david-sacks.jpg',
        url: 'https://x.com/HumanHarlan/status/1864858286065111298',
      },
    ],
  },

  communityMembers: [
    {
      name: 'Neel Nanda',
      jobTitle: 'Mech Interp Lead at Google DeepMind',
      course: 'Former participant and facilitator',
      imageSrc: '/images/graduates/neel.jpeg',
      url: 'https://www.neelnanda.io/about',
    },
    {
      name: 'Marius Hobbhahn',
      jobTitle: 'CEO at Apollo Research',
      course: 'AI Alignment Course Graduate',
      imageSrc: '/images/graduates/marius.jpeg',
      url: 'https://www.mariushobbhahn.com/aboutme/',
    },
    {
      name: 'Chiara Gerosa',
      jobTitle: 'Executive Director at Talos',
      course: 'AI Governance Course Facilitator',
      imageSrc: '/images/graduates/chiara.jpeg',
      url: 'https://www.linkedin.com/in/chiaragerosa/',
    },
    {
      name: 'Richard Ngo',
      jobTitle: 'Former OpenAI and DeepMind',
      course: 'AI Alignment Course Designer',
      imageSrc: '/images/graduates/richard.jpg',
      url: 'https://www.richardcngo.com/',
    },
    {
      name: 'Adam Jones',
      jobTitle: 'Member of Technical Staff at Anthropic',
      course: 'Former AI safety lead at BlueDot',
      imageSrc: '/images/graduates/adam.jpg',
      url: 'https://adamjones.me/',
    },
    {
      name: 'Catherine Fist',
      jobTitle: 'Head of Delivery at UK AISI',
      course: 'AI Governance Course Graduate',
      imageSrc: '/images/graduates/catherine.jpeg',
      url: 'https://www.linkedin.com/in/catherine-fist/',
    },
  ],

  faq: {
    title: 'Frequently Asked Questions',
    items: [
      {
        id: 'funding',
        question: 'Can I just apply for funding?',
        answer: 'Funding is only available for graduates of the course.',
      },
      {
        id: 'technical',
        question: 'How much technical background do I need?',
        answer: (
          <>
            You should understand the basics of how LLMs are trained/fine-tuned, that AI development is driven by data, algorithms and compute, and that the reward function for neural networks is optimised through gradient descent.
            <br /> <br />
            Our 2-hour, self-paced <span className="underline"><Link href="https://bluedot-impact.notion.site/AI-Foundations-293f8e69035380f29863c4c92c41fac7" target="_blank">AI Foundations course</Link></span> will give you enough background.
          </>
        ),
      },
      {
        id: 'agi-strategy',
        question: 'Do I need to take the AGI strategy course first?',
        answer: (
          <>
            It is not a prerequisite, but we recommend it!
            <br /><br />
            The AGI Strategy course shows how technical safety fits into the broader strategy for making AI go well. Technical safety is one component among many.
          </>
        ),
      },
      {
        id: 'bluedot',
        question: 'Who is BlueDot Impact?',
        answer: (
          <>
            We're a London-based startup. Since 2022, we've trained 5,000 people, with ~1,000 now working on making AI go well.
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
    imageSrc: '/images/agi-strategy/hero-banner-split.png',
    imageAlt: 'Technical AI Safety banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.png',
  },
});
