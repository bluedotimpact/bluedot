export type Course = {
  title: string;
  description: string;
  courseType: CourseType;
  courseLength: string;
  imageSrc: string;
  href: string;
  isNew?: boolean;
  isFeatured?: boolean;
};

export type CourseUnit = {
  title: string;
  description: string;
  href: string;
  chapters?: CourseChapter[];
};

export type CourseChapter = {
  type: 'Reading' | 'Demo' | 'Quiz' | 'Exercise';
  title: string;
};

export type CourseType = 'Crash course' | 'Self-paced' | 'In-depth course';

export const COURSES: Course[] = [
  {
    title: 'The Future of AI Course',
    description: 'A self-paced, 2-hour course designed for people with no technical background to learn how AI will reshape our world.',
    courseType: 'Self-paced',
    courseLength: '',
    imageSrc: '/images/courses/future-of-ai.png',
    href: 'https://course.bluedot.org/future-of-ai/',
    isNew: true,
    isFeatured: true,
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
] as const;

export const COURSE_UNITS: CourseUnit[] = [
  {
    title: 'Unit 1',
    description: 'Beyond chatbots: the expanding frontier of AI capabilities',
    href: 'https://course.bluedot.org/future-of-ai/units/1',
    chapters: [
      {
        type: 'Reading',
        title: 'How current AI systems work',
      },
      {
        type: 'Demo',
        title: 'They can build things',
      },
      {
        type: 'Reading',
        title: 'The speed of progress',
      },
      {
        type: 'Reading',
        title: 'From tools to agents',
      },
      {
        type: 'Exercise',
        title: '5 years ago, 5 years ahead',
      },
    ],
  },
  {
    title: 'Unit 2',
    description: 'Artificial general intelligence: on the horizon?',
    href: 'https://course.bluedot.org/future-of-ai/units/2',
  },
  {
    title: 'Unit 3',
    description: 'AGI will drastically change how we live',
    href: 'https://course.bluedot.org/future-of-ai/units/3',
  },
  {
    title: 'Unit 4',
    description: 'What can be done?',
    href: 'https://course.bluedot.org/future-of-ai/units/4',
  },
] as const;
