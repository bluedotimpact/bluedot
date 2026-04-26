import { type CourseLanderContent } from '../CourseLander';

export const BIOSECURITY_COLORS = {
  gradient: 'linear-gradient(135deg, #012A07 10%, rgba(1, 42, 7, 0.00) 90%), radial-gradient(110.09% 127.37% at 112.15% 117.08%, rgba(220, 238, 171, 0.45) 0%, rgba(86, 140, 94, 0.45) 50%, rgba(1, 42, 7, 0.45) 100%), radial-gradient(97.29% 122.23% at 85.59% 126.89%, rgba(222, 149, 47, 0.35) 0%, rgba(157, 205, 98, 0.35) 52.4%, rgba(28, 175, 141, 0.35) 100%), #012A07',
  accent: '#ABEEB5',
  categoryLabel: '#81DBAF',
  iconBackground: '#316761',
  bright: '#e5faea',
  full: '#3da462',
};

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

  whoIsThisForText: {
    title: 'Who this course is for',
    paragraphs: [
      'COVID exposed how unprepared we were, AI is starting to lower the barrier to engineering dangerous pathogens, and you don\'t think the people in charge have a serious plan for the next pandemic. You want to change that.',
      'The course is an in-depth introduction to the biological threats we face, what\'s being done to prevent and respond to them, and where you can contribute.',
      'It\'s built for three groups: 1) scientists and engineers who want to point their skills at biodefence; 2) policy professionals shaping how governments prepare; and 3) entrepreneurs and operators ready to build new pandemic defences.',
      'Not sure you fit? Apply anyway. Recent cohorts have also included teachers, lawyers, doctors, and community organisers.',
    ],
  },

  courseBenefitsText: {
    title: 'How this course will benefit you',
    items: [
      {
        heading: 'A launchpad for your biosecurity career',
        body: 'You\'ll leave this course with an opinion on which biological threats matter most, early takes on how we could defend against them, and concrete next steps you can take.',
      },
      {
        heading: 'A clear way to think about pandemic risk',
        body: 'You\'ll learn how pathogens spread and where our defences break down. You\'ll see how AI is widening the threat surface. And you\'ll apply layered-defence thinking to evaluate and prioritise interventions. You\'ll know enough to hold your own in rooms with experts.',
      },
      {
        heading: 'A community of builders',
        body: 'BlueDot has 7,000+ alumni, with many now working on pandemic preparedness at top biosecurity organisations, governments, and new ventures defending against bio risks. You\'ll meet people in the field who can open doors for you and pressure-test your thinking.',
      },
    ],
  },

  howTheCourseWorks: {
    title: 'How the course works',
    courseSlug,
    paragraphs: ({ intenseUnits, partTimeUnits }) => [
      <>The course has two &ldquo;intensity levels&rdquo;: part-time and intensive.</>,
      <>If you join the <em>part-time</em> course, you&rsquo;ll invest ~5h/week for {partTimeUnits ?? 6} weeks.</>,
      <>If you join the <em>intensive</em> course, you&rsquo;ll invest ~5h/day for {intenseUnits ?? 6} days.</>,
      <>Each day/week, you&rsquo;ll complete 2&ndash;3 hours of reading and writing, followed by a 2h group discussion with ~8 peers over Zoom.</>,
      <>All discussions are facilitated by a biosecurity expert who can help introduce you to others in the field.</>,
      <><strong>This course is free</strong>, and operates on a &ldquo;pay-what-you-want&rdquo; model.</>,
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
        title: 'AGI Strategy',
        summary: 'The strategic landscape of AI risk, including where AI×bio sits. For biosecurity people who want the broader picture.',
        href: '/courses/agi-strategy',
        ctaLabel: 'Explore the course',
      },
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
        quote: '"[COVID-19] has been very severe … it has affected every corner of this planet. But this is not necessarily the big one."',
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
        id: 'background',
        question: 'What background do I need?',
        answer: 'We don\'t care about your CV. We care about what you\'ll do next. Recent cohorts have included people from policy, engineering, life sciences, medicine, law, and operations. What they shared was drive and a bias toward action.',
      },
      {
        id: 'biology-expertise',
        question: 'How much biology expertise do I need?',
        answer: 'None. We\'ll help you build the foundation. The course is designed for serious thinkers from any background. We cover the biology you need as we go.',
      },
      {
        id: 'beginners',
        question: 'Is this course for beginners?',
        answer: 'It\'s for people new to working on biosecurity, not new to thinking hard. If you\'ve been reading and thinking, and are ready to act, this is where you start.',
      },
      {
        id: 'formats',
        question: 'What\'s the difference between intensive and part-time?',
        answer: 'Same content, different pace. Intensive is ~6 days at ~5h/day, for people who can clear a week and want to move fast. Part-time is ~6 weeks at ~5h/week, for people fitting this around other commitments. Both end in the same place.',
      },
      {
        id: 'timezones',
        question: 'What time zones do you run cohorts in?',
        answer: 'We run discussions across a wide range of timezones. You\'ll tell us your availability and we\'ll put you in a group that works for your current schedule.',
      },
      {
        id: 'funding',
        question: 'Is there funding available?',
        answer: (
          <>
            Yes. Funding is available to graduates of the course. See <a href="/programs" className="underline">bluedot.org/programs</a> for current grants and how to apply.
          </>
        ),
      },
      {
        id: 'certificate',
        question: 'Will I get a certificate?',
        answer: 'Yes. Participants who complete the course receive a digital certificate they can share on LinkedIn or with employers.',
      },
      {
        id: 'free',
        question: 'Is it really free?',
        answer: 'Yes.',
      },
      {
        id: 'bluedot',
        question: 'Who is BlueDot Impact?',
        answer: 'BlueDot is the leading talent accelerator for beneficial AI and societal resilience. We run courses, help people land jobs, organise events around the world, and back people starting new organisations. We\'ve trained thousands of people since 2022. Our alumni now work on pandemic preparedness, AI safety, and AI governance at top organisations and have founded new ones.',
      },
    ],
  },

  banner: {
    title: 'Start building a pandemic-proof world today',
    ctaText: 'Apply now',
    ctaUrl: applicationUrlWithUtm,
    imageSrc: '/images/lander/biosecurity/hero-banner-split.webp',
    imageAlt: 'Biosecurity banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.webp',
  },
});
