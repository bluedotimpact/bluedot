import { ROUTES } from './routes';

export type ResearchItem = {
  title: string;
  url: string;
  summary: string;
  authors: string;
  date: string;
  method: string;
  ctaLabel?: string;
};

export type ResearchArea = {
  id: string;
  title: string;
  description: string;
  items: ResearchItem[];
};

// Newest first within each area. Only list published work by BlueDot staff:
// grantee and participant research belongs on the pages in RESEARCH_SUPPORT.
export const RESEARCH_AREAS: ResearchArea[] = [
  {
    id: 'field-strategy',
    title: 'Field strategy',
    description: 'We map a problem area through the literature and dozens of expert calls, then turn what we learn into concrete projects for founders and researchers.',
    items: [
      {
        title: 'Missions',
        url: ROUTES.missions.url,
        summary: 'Problem briefs for projects we\'d love someone to take on, each setting out the problem, why it matters, what success looks like and the work needed.',
        authors: 'BlueDot Impact',
        date: 'Since May 2026',
        method: 'Problem briefs',
        ctaLabel: 'See missions',
      },
      {
        title: 'Field strategy: critical worker respiratory protection',
        url: 'https://docs.google.com/document/d/1XAfw9XHltgjDEIjVkKpyStaGdGbZbL6ss3PO6G6EGY4/edit?tab=t.gphxdsc7qzoc',
        summary: 'Problem analysis, theory of change and cost-effectiveness estimates for giving critical workers high-quality respirators in a severe pandemic.',
        authors: 'Dewi Erwan',
        date: 'May 2026',
        method: 'Working draft',
      },
      {
        title: 'A playbook for field strategy',
        url: 'https://blog.bluedot.org/p/field-strategy-playbook',
        summary: 'Our method for field strategy research: about 50 expert calls in 50 days, then a strategy that names the threat, what success looks like, the main obstacle and the next 6–12 months of work.',
        authors: 'Dewi Erwan',
        date: 'December 2025',
        method: 'Method',
      },
      {
        title: 'Field strategy: UV air disinfection',
        url: 'https://docs.google.com/document/d/1siKzEQvZqkKI1oPWpKLPPOWSqJCTB_cIr3PYHSJRYpg/edit?tab=t.0',
        summary: 'Why UV air disinfection matters, where it stands today, what is holding it back, and the trials and safety studies that would move it forward.',
        authors: 'Dewi Erwan',
        date: 'November 2025',
        method: 'Working draft',
      },
      {
        title: 'Our experiments to support founders to protect humanity',
        url: 'https://blog.bluedot.org/p/startup-studio',
        summary: 'Three weeks scoping pandemic PPE stockpiles with 50+ expert interviews, organized around three questions: what needs to be done, who will pay for it and who will make it happen.',
        authors: 'Dewi Erwan',
        date: 'November 2025',
        method: 'Problem scoping',
      },
    ],
  },
  {
    id: 'strategy-and-threat-models',
    title: 'Strategy and threat models',
    description: 'Reviews of how AI could cause catastrophe, which plans could prevent it and what the field needs, built on expert interviews and the published literature.',
    items: [
      {
        title: 'We asked 10+ AI safety orgs about their hiring needs',
        url: 'https://blog.bluedot.org/p/we-asked-ai-safety-orgs-about-their-hiring-needs',
        summary: 'Interviews with hiring managers at more than ten AI safety organizations. The hardest people to find can lead work on their own and care deeply about AI risk.',
        authors: 'Li-Lian Ang',
        date: 'February 2026',
        method: 'Interview study',
      },
      {
        title: 'How AI could enable catastrophic pandemics',
        url: 'https://blog.bluedot.org/p/how-ai-could-enable-catastrophic-pandemics',
        summary: 'How AI could lower the barriers to creating pandemic pathogens, drawing on frontier-model safety evaluations, studies of AI-enabled biological tools and the history of bioweapons programs.',
        authors: 'Will Saunter',
        date: 'October 2025',
        method: 'Literature review',
      },
      {
        title: 'How AI could enable critical infrastructure collapse',
        url: 'https://blog.bluedot.org/p/how-ai-could-enable-critical-infrastructure-collapse',
        summary: 'How AI cuts the expertise and time needed to attack power grids, water systems and hospitals, drawing on real incidents and recent research on AI\'s offensive cyber capabilities.',
        authors: 'Li-Lian Ang',
        date: 'October 2025',
        method: 'Literature review',
      },
      {
        title: 'Our vision for comprehensive AI safety training',
        url: 'https://blog.bluedot.org/p/course-portfolio-vision',
        summary: 'Interviews with 50+ AI safety experts and a review of the strategy literature, distilled into a five-layer defense-in-depth framework: prevent, detect, constrain, withstand and adapt.',
        authors: 'Will Saunter',
        date: 'July 2025',
        method: 'Expert interviews',
      },
      {
        title: '5 ways to develop an AI safety plan or field strategy',
        url: 'https://blog.bluedot.org/p/5-ways-to-develop-ai-safety-plan',
        summary: 'Eleven concrete methods for building a plan, grouped into five approaches, with lessons from the ones we tried.',
        authors: 'Adam Jones',
        date: 'June 2025',
        method: 'Methods',
      },
      {
        title: 'What makes a good AI safety plan?',
        url: 'https://blog.bluedot.org/p/what-makes-a-good-ai-safety-plan',
        summary: 'Criteria for judging whether an AI safety plan would actually work, and a prompt for stress-testing your own.',
        authors: 'Adam Jones',
        date: 'June 2025',
        method: 'Framework',
      },
      {
        title: 'Key paths, plans and strategies to AI safety success',
        url: 'https://blog.bluedot.org/p/ai-safety-paths-plans-and-strategies',
        summary: 'A map of the main routes to AI safety success, from a review of 50+ published plans and interviews with 10+ researchers.',
        authors: 'Adam Jones',
        date: 'June 2025',
        method: 'Literature review',
      },
    ],
  },
  {
    id: 'program-studies',
    title: 'Studies of our programs',
    description: 'We test whether our courses and programs work and publish what we find, including null results.',
    items: [
      {
        title: 'Can you teach context?',
        url: 'https://blog.bluedot.org/p/can-you-teach-context',
        summary: 'A four-day residential experiment with 24 participants. We broke AI safety "context" into five learnable components and report what worked and what didn\'t.',
        authors: 'Joshua Landes and Harry Waterman',
        date: 'September 2026',
        method: 'Pilot study',
      },
      {
        title: 'How to avoid the 3 mistakes behind most rejected Technical AI Safety applicants',
        url: 'https://blog.bluedot.org/p/avoid-technical-ai-safety-application-mistakes',
        summary: 'What separated strong and weak applicants across roughly 1,000 applications to our Technical AI Safety course.',
        authors: 'Li-Lian Ang',
        date: 'November 2025',
        method: 'Application analysis',
      },
      {
        title: 'What we learned from turning our AGI Strategy Course into an Incubator',
        url: 'https://blog.bluedot.org/p/a-bluedot-incubator-v1',
        summary: 'A five-day pilot with seven participants that produced six problem-solution documents, and what we would change about format, selection and co-founder matching.',
        authors: 'Joshua Landes and Aniket Chakravorty',
        date: 'October 2025',
        method: 'Program evaluation',
      },
      {
        title: 'What we learned from our first Operations Bootcamp',
        url: 'https://blog.bluedot.org/p/first-ops-bootcamp-lessons',
        summary: 'Participant feedback, outreach results and success criteria from a bootcamp for experienced operations professionals moving into AI safety organizations.',
        authors: 'BlueDot Impact',
        date: 'June 2025',
        method: 'Program evaluation',
      },
      {
        title: 'AI Alignment June 2024 course retrospective',
        url: 'https://blog.bluedot.org/p/ai-alignment-june-2024-retro',
        summary: 'Half of participants submitted a project, up from 36% on the previous run, and more were rated high quality. What drove the gains and what we still need to fix.',
        authors: 'Adam Jones',
        date: 'October 2024',
        method: 'Course retrospective',
      },
      {
        title: 'Does project proposal feedback result in better final projects?',
        url: 'https://blog.bluedot.org/p/is-proposal-feedback-helpful',
        summary: 'We gave feedback on a random half of 81 project proposals. It made no significant difference to how many projects were finished or how good they were.',
        authors: 'Adam Jones',
        date: 'October 2024',
        method: 'Randomized test',
      },
      {
        title: 'Summary of AI alignment participant user interviews',
        url: 'https://blog.bluedot.org/p/alignment-participant-user-interviews',
        summary: 'How participants on our June 2024 AI Alignment course used the readings, exercises and discussions, and where the course fell short.',
        authors: 'Adam Jones',
        date: 'September 2024',
        method: 'Interview study',
      },
      {
        title: 'How to avoid the 2 mistakes behind 89% of rejected AI alignment applications',
        url: 'https://blog.bluedot.org/p/avoid-alignment-application-mistakes',
        summary: 'An analysis of rejected applications to our AI Alignment course, classified with an LLM and spot-checked by hand.',
        authors: 'Adam Jones',
        date: 'July 2024',
        method: 'Application analysis',
      },
      {
        title: 'What we learnt from running our AI alignment course in March 2024',
        url: 'https://blog.bluedot.org/p/ai-alignment-march-2024-retro',
        summary: 'A structured look back at the course\'s systems, curriculum and recruitment, published as part of how we work in public.',
        authors: 'Adam Jones',
        date: 'July 2024',
        method: 'Course retrospective',
      },
      {
        title: '2022 AI Alignment Course: 5→37% working on AI safety',
        url: 'https://blog.bluedot.org/p/2022-ai-alignment-course-impact',
        summary: 'We traced the careers of the 342 people on our 2022 course. The share working on AI safety rose from about 5% to about 37%.',
        authors: 'Dewi Erwan',
        date: 'May 2024',
        method: 'Cohort follow-up',
      },
      {
        title: 'How to avoid the 4 mistakes behind 92% of rejected AI governance applications',
        url: 'https://blog.bluedot.org/p/avoid-governance-application-mistakes',
        summary: 'An analysis of rejected applications to our AI Governance course and the four mistakes behind most of them.',
        authors: 'Adam Jones',
        date: 'April 2024',
        method: 'Application analysis',
      },
      {
        title: '2023 Impact Report Summary',
        url: 'https://blog.bluedot.org/p/2023-impact-report',
        summary: 'Our public summary of 2023: how we delivered our courses, the platform we built to run them at scale, and what participants got from them.',
        authors: 'Dewi Erwan',
        date: 'March 2024',
        method: 'Annual report',
      },
    ],
  },
  {
    id: 'research-agendas',
    title: 'Research agendas',
    description: 'Open questions and project ideas we want people to work on, with guidance on doing the work well.',
    items: [
      {
        title: 'Give AI companies something to aim for. The case for beneficial capability evals.',
        url: 'https://blog.bluedot.org/p/give-ai-companies-something-to-aim',
        summary: 'Why we need benchmarks for capabilities that keep us safe, such as safety research and cyber defense, and two ways to build them.',
        authors: 'Adam Jones and Li-Lian Ang',
        date: 'January 2026',
        method: 'Research agenda',
      },
      {
        title: 'Navigating dual-use projects in biosecurity',
        url: 'https://blog.bluedot.org/p/dual-use-advice',
        summary: 'How to judge and manage the misuse risk in biosecurity projects such as benchmarks, AI agents and red-teaming, written for our course participants and hackathon teams.',
        authors: 'Will Saunter',
        date: 'November 2025',
        method: 'Guidance',
      },
      {
        title: '3 articles on AI safety we\'d like to exist',
        url: 'https://blog.bluedot.org/p/ai-safety-articles-we-would-like-to-exist',
        summary: 'Three gaps in the literature we kept running into while teaching, and what each missing article should cover.',
        authors: 'Adam Jones',
        date: 'June 2024',
        method: 'Research gaps',
      },
      {
        title: 'AI governance project ideas',
        url: 'https://blog.bluedot.org/p/ai-governance-project-ideas',
        summary: 'Five worked examples of governance research projects, from regional policy analysis to a policy tracker and historical case studies.',
        authors: 'Luke Drago',
        date: 'June 2024',
        method: 'Project ideas',
      },
      {
        title: 'AI alignment project ideas',
        url: 'https://blog.bluedot.org/p/alignment-project-ideas',
        summary: 'A curated list of alignment research projects for our course participants, from model organisms of misalignment to interpretability and compute governance.',
        authors: 'Adam Jones',
        date: 'April 2024',
        method: 'Project ideas',
      },
      {
        title: 'How to do an excellent AI alignment project',
        url: 'https://blog.bluedot.org/p/alignment-project-guidance',
        summary: 'How to run a strong course project: pick one narrow question, test it early, build a minimal working version and improve it with feedback.',
        authors: 'Adam Jones',
        date: 'April 2024',
        method: 'Guidance',
      },
    ],
  },
];

export type ResearchSupportLink = {
  title: string;
  url: string;
  summary: string;
  ctaLabel: string;
};

export const RESEARCH_SUPPORT: ResearchSupportLink[] = [
  {
    title: 'Technical AI Safety Project Sprint',
    url: '/courses/technical-ai-safety-project',
    summary: 'A mentored 30-hour project course for graduates of our Technical AI Safety course. Participants choose a project and see it through.',
    ctaLabel: 'See the sprint',
  },
  {
    title: 'Rapid Grants',
    url: '/grants/rapid#grants-made',
    summary: 'Fast grants for compute, research tools and travel to present research. Grantees design and run their own projects.',
    ctaLabel: 'See funded projects',
  },
  {
    title: 'Participant projects',
    url: 'https://blog.bluedot.org/s/projects',
    summary: 'Course participants publish their end-of-course projects on our blog, from interpretability experiments to biosecurity analyses.',
    ctaLabel: 'Read on our blog',
  },
];
