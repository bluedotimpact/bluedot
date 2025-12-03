import {
  PiBriefcase,
  PiCompass,
  PiFlask,
  PiClockClockwise,
  PiChats,
  PiHandHeart,
  PiCalendarDots,
  PiRocketLaunch,
  PiUsersThree,
  PiHandCoins,
} from 'react-icons/pi';
import { CourseLanderContent } from '../CourseLander';

export const BIOSECURITY_APPLICATION_URL = 'https://web.miniextensions.com/aHs5xwcmFOE2nbMf0zaY';

export const createBioSecurityContent = (
  applicationUrlWithUtm: string,
  courseSlug: string,
): CourseLanderContent => ({
  meta: {
    title: 'Biosecurity Course | BlueDot Impact',
    description: 'Start building towards a pandemic-proof world. Join our intensive course to prevent, detect and respond to pandemic threats.',
  },

  hero: {
    categoryLabel: 'BIOSECURITY',
    title: 'Start building towards a pandemic-proof world',
    description: 'Understand current efforts to prevent, detect and respond to pandemic threats. Identify where you can contribute. Get funded to start building. All in 30 hours.',
    primaryCta: {
      text: 'Apply now',
      url: applicationUrlWithUtm,
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: `/courses/${courseSlug}/1/1`,
    },
    imageSrc: '/images/lander/biosecurity/hero-banner-split.png',
    imageAlt: 'Biosecurity visualization',
  },

  whoIsThisFor: {
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
      boldText: "Don't fit these perfectly? Apply anyway.",
      text: 'Some of our most impactful participants have included teachers, policymakers, engineers, and community leaders. We bet on drive and ambition, not CVs.',
      buttonText: 'Apply now',
      buttonUrl: applicationUrlWithUtm,
    },
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
        description: 'Skip months of scattered reading. This biosecurity course gives you a structured overview of efforts to prevent, detect and respond to pandemics. Understand what works, what fails, and where the gaps are.',
      },
      {
        icon: PiUsersThree,
        title: 'Join a network of builders',
        description: "This course isn't for everyone. We're building a community of people who are energised to take ambitious actions to build a pandemic-proof world, including starting new companies, policy entrepreneurship, and high-impact research bets. Completing this course will give you access to this community.",
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
    courseSlug,
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
        description: 'All discussions will be facilitated by a biosecurity expert.',
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

  quotes: {
    quotes: [
      {
        quote: '"[COVID-19] has been very severe … it has affected every corner of this planet. But this is not necessarily the big one."',
        name: 'Dr Michael Ryan',
        role: 'Former Executive Director, WHO Health Emergencies Programme',
        imageSrc: '/images/lander/biosecurity/michael-ryan.jpg',
        url: 'https://www.theguardian.com/world/2020/dec/29/who-warns-covid-19-pandemic-is-not-necessarily-the-big-one',
      },
      {
        quote: '"AI will unlock nearly limitless potential in biology. . . . At the same time, it could create new pathways for malicious actors to synthesize harmful pathogens and other biomolecules."',
        name: 'America\'s AI Action Plan',
        role: 'Trump Administration',
        imageSrc: '/images/lander/biosecurity/white-house.jpg',
        url: 'https://www.whitehouse.gov/wp-content/uploads/2025/07/Americas-AI-Action-Plan.pdf',
      },
      {
        quote: '"A straightforward extrapolation of today\'s systems to those we expect to see in 2 to 3 years suggests a substantial risk that AI systems will be able to fill in all the missing pieces, enabling many more actors to carry out large-scale biological attacks. We believe this represents a grave threat to U.S. national security."',
        name: 'Dario Amodei',
        role: 'CEO, Anthropic',
        imageSrc: '/images/lander/foai/dario.jpeg',
        url: 'https://www.congress.gov/event/118th-congress/senate-event/LC72507/text',
      },
      // {
      //   quote: '"Five years ago, our country was caught unprepared by the Covid pandemic. It would be a tragedy if we failed to do enough to ensure we are sufficiently prepared for the next one. Biosecurity is now an essential aspect of national security and growth."',
      //   name: 'Tony Blair and William Hague',
      //   role: 'Former UK Prime Minister and Leader of the Opposition',
      //   imageSrc: '/images/lander/biosecurity/blair-hague.jpg',
      //   url: 'https://institute.global/insights/politics-and-governance/a-new-national-purpose-biosecurity-as-the-foundation-for-growth-and-global-leadership',
      // },
      {
        quote: '"We\'re reaching an inflection point with biotechnology where, with the help of AI, we are starting to be able to program cells like we program computers. This inflection point will define our national and economic security in the decades to come."',
        name: 'Michelle Rozo',
        role: 'Vice-Chair, National Security Commission on Emerging Biotechnology',
        imageSrc: '/images/lander/biosecurity/michelle-rozo.png',
        url: 'https://www.biotech.senate.gov/press-releases/ai-action-plan-a-critical-step-for-aixbio-innovation-national-security-and-global-economic-competitiveness',
      },
    ],
  },

  communityMembersTitle: 'Meet our alumni working on biosecurity',

  communityMembers: [
    {
      name: 'Dr Michael Friedman',
      jobTitle: 'Asia Center for Health Security',
      course: 'Course Facilitator',
      imageSrc: '/images/graduates/michael-friedman.png',
      url: 'https://asia-chs.org/team/visiting-associate-prof-michael-friedman/',
    },
    {
      name: 'Janvi Ahuja',
      jobTitle: 'Pandemic Sciences Institute, Oxford',
      course: 'Course Designer',
      imageSrc: '/images/graduates/janvi-ahuja.jpeg',
      url: 'https://www.janvi.xyz/',
    },
    {
      name: 'Rachel Hovde',
      jobTitle: 'Policy Director, Americans for Responsible Innovation',
      course: 'Course Graduate',
      imageSrc: '/images/graduates/rachel-hovde.jpeg',
      url: 'https://www.linkedin.com/in/rachel-hovde-52b1b146/',
    },
    {
      name: 'Peter Babigumira Ahabwe',
      jobTitle: 'Epidemic Intelligence Analyst, Ugandan Ministry of Health',
      course: 'Course Facilitator',
      imageSrc: '/images/graduates/peter-ahabwe.jpeg',
      url: 'https://www.linkedin.com/in/babigumira09/',
    },
    {
      name: 'Scott Olesen',
      jobTitle: 'Center for Forecasting & Outbreak Analytics, US CDC',
      course: 'Course Graduate',
      imageSrc: '/images/graduates/scott-olesen.jpeg',
      url: 'https://www.linkedin.com/in/scott-olesen/',
    },
    {
      name: 'Felix Moronta',
      jobTitle: 'International Centre for Genetic Engineering and Biotechnology',
      course: 'Course Facilitator',
      imageSrc: '/images/graduates/felix-moronta.jpeg',
      url: 'https://www.linkedin.com/in/morontafelix/',
    },
    {
      name: 'Natalie Kiilu',
      jobTitle: 'Oxford Biosecurity Group',
      course: 'Course Participant',
      imageSrc: '/images/graduates/natalie-kiilu.jpeg',
      url: 'https://www.linkedin.com/in/natalie-kiilu-6a4a94169/',
    },
    {
      name: 'Sarah Koeller',
      jobTitle: 'Center for Forecasting & Outbreak Analytics, US CDC',
      course: 'Course Graduate',
      imageSrc: '/images/graduates/sarah-koeller.jpeg',
      url: 'https://www.linkedin.com/in/sarah-koeller/',
    },
    {
      name: 'Raffael Luca Schumann',
      jobTitle: 'Jason Chin Lab, Cambridge',
      course: 'Course Graduate',
      imageSrc: '/images/graduates/raffael-luca-schumann.jpeg',
      url: 'https://www.linkedin.com/in/raffael-luca-schumann-139760194/',
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
      {
        id: 'biology-expertise',
        question: 'How much biology expertise do I need?',
        answer: 'None! We will help you understand the basics.',
      },
    ],
  },

  banner: {
    title: 'Start building a pandemic-proof world today',
    ctaText: 'Apply now',
    ctaUrl: applicationUrlWithUtm,
    imageSrc: '/images/agi-strategy/hero-banner-split.png',
    imageAlt: 'Biosecurity banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.webp',
  },
});
