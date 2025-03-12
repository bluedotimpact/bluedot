export type Course = {
  title: string;
  description: string;
  courseType: CourseType;
  courseLength: string;
  imageSrc: string;
  href: string;
  isNew?: boolean;
};

export type CourseType = 'Crash course' | 'Self-paced' | 'In-depth course';

export const COURSES: Course[] = [
  {
    title: 'The AI Impact',
    description: 'A self-paced, 2-hour course designed for people with no technical background to learn how AI will reshape our world.',
    courseType: 'Self-paced',
    courseLength: '',
    imageSrc: '/images/courses/ai-impact.png',
    href: 'https://aisafetyfundamentals.com/ai-impact/',
    isNew: true,
  },
  {
    title: 'AI Safety: Intro to Transformative AI',
    description: 'The risks and opportunities of advanced AI are evolving at unprecedented speed—and so is the need for capable individuals to shape its trajectory. This intensive 5-day course is for those who want to rapidly develop their understanding of transformative AI and its impact on humanity.',
    courseType: 'Crash course',
    courseLength: '5 days',
    imageSrc: '/images/courses/intro.jpg',
    href: 'https://aisafetyfundamentals.com/intro-to-tai/',
  },
  {
    title: 'Economics of Transformative AI',
    description: 'The risks and opportunities of advanced AI are evolving at unprecedented speed—and economists play a crucial role in shaping how society prepares for this transformation. This 9-week course is designed for economists who want to develop their understanding of transformative AI and its economic impacts.',
    courseType: 'In-depth course',
    courseLength: '9 weeks',
    imageSrc: '/images/courses/econ.jpg',
    href: 'https://aisafetyfundamentals.com/economics-of-tai/',
  },
  {
    title: 'AI Alignment',
    description: 'AI systems are rapidly becoming more capable and more general. Despite AI\'s potential to radically improve human society, there are still open questions about how we build AI systems that are controllable, aligned with our intentions and interpretable.',
    courseType: 'In-depth course',
    courseLength: '12 weeks',
    imageSrc: '/images/courses/alignment.jpg',
    href: 'https://aisafetyfundamentals.com/alignment/',
  },
  {
    title: 'AI Governance',
    description: 'The rise of any powerful technology demands a thoughtful approach to its governance and regulation. There has been increasing interest in how AI governance can and should mitigate extreme risks from AI, but it can be difficult to get up to speed on research and ideas in this area.',
    courseType: 'In-depth course',
    courseLength: '12 weeks',
    imageSrc: '/images/courses/gov.jpg',
    href: 'https://aisafetyfundamentals.com/governance/',
  },
  {
    title: 'Writing Intensive',
    description: 'This is a 5-day intensive writing course where you`ll transform your AI safety course learnings into a published article.',
    courseType: 'Crash course',
    courseLength: '5 days',
    imageSrc: '/images/courses/writing.jpg',
    href: 'https://aisafetyfundamentals.com/writing/',
  },
  {
    title: 'Economics of Transformative AI Fast-Track',
    description: 'The risks and opportunities of advanced AI are evolving at unprecedented speed—and economists play a crucial role in shaping how society prepares for this transformation. This 9-week course is designed for economists who want to develop their understanding of transformative AI and its economic impacts.',
    courseType: 'Crash course',
    courseLength: '5 days',
    imageSrc: '/images/courses/econ-fasttrack.jpg',
    href: 'https://aisafetyfundamentals.com/economics-of-tai-fast-track/',
  },
  {
    title: 'Alignment Fast-Track',
    description: 'AI systems are rapidly becoming more capable and more general. Despite AI\'s potential to radically improve human society, there are still open questions about how we build AI systems that are controllable, aligned with our intentions and interpretable.',
    courseType: 'Crash course',
    courseLength: '5 days',
    imageSrc: '/images/courses/alignment-fasttrack.jpg',
    href: 'https://aisafetyfundamentals.com/alignment-fast-track/',
  },
  {
    title: 'Governance Fast-Track',
    description: 'Despite AI\'s potential to radically improve human society, there are still active debates about how we will wield the AI systems of today and tomorrow. The rise of this powerful technology demands a thoughtful approach to its governance and regulation.',
    courseType: 'Crash course',
    courseLength: '5 days',
    imageSrc: '/images/courses/gov-fasttrack.jpg',
    href: 'https://aisafetyfundamentals.com/governance-fast-track/',
  },
] as const;
