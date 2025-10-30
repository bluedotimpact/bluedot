import {
  Section,
  ProgressDots,
} from '@bluedot/ui';
import {
  H1, H3, H4, P,
} from '@bluedot/ui/src/Text';
import clsx from 'clsx';
import { PiShieldStarLight, PiShootingStarLight, PiUsersThreeLight } from 'react-icons/pi';
import { withClickTracking } from '../../lib/withClickTracking';

type Course = {
  id: string;
  title: string;
  shortDescription: string;
  path: string;
  durationDescription?: string;
  cadence?: string;
  additionalTag?: string;
  isFeatured?: boolean;
  image?: string | null;
  icon?: string;
};

// Hardcoded course data
const HARDCODED_COURSES: Course[] = [
  {
    id: 'future-of-ai',
    title: 'The Future of AI',
    shortDescription: 'An introduction to what AI can do today, where it\'s going over the next decade, and how you can start contributing to a better future.',
    path: '/courses/future-of-ai',
    durationDescription: '1h',
    cadence: 'Self-paced',
    isFeatured: true,
    icon: '/images/courses/future-of-ai-icon.svg',
  },
  {
    id: 'agi-strategy',
    title: 'AGI Strategy',
    shortDescription: 'A deep dive into the incentives driving the AI companies, what\'s at stake, and the strategies for ensuring AI benefits humanity. You\'ll finish with your own action plan.',
    path: '/courses/agi-strategy',
    durationDescription: '30h',
    cadence: 'Cohort-based',
    additionalTag: 'Every month',
    isFeatured: false,
    icon: '/images/courses/agi-strategy-icon.svg',
  },
  {
    id: 'biosecurity',
    title: 'Biosecurity',
    shortDescription: 'For people who want to build a pandemic-proof world. Learn how we can defend against AI-enabled bioattacks.',
    path: '/courses/biosecurity',
    durationDescription: '30h',
    cadence: 'Cohort-based',
    additionalTag: 'Every month',
    isFeatured: false,
    icon: '/images/courses/biosecurity-icon.svg',
  },
  {
    id: 'technical-ai-safety',
    title: 'Technical AI Safety',
    shortDescription: 'For technical talent who want to drive AI safety research and policy professionals building governance solutions.',
    path: '/courses/technical-ai-safety',
    durationDescription: '30h',
    cadence: 'Cohort-based',
    additionalTag: 'Every month',
    isFeatured: false,
    icon: '/images/courses/technical-ai-safety-icon.svg',
  },
  {
    id: 'ai-governance',
    title: 'AI Governance',
    shortDescription: 'Learn about the policy landscape, regulatory tools, and institutional reforms needed to navigate the transition to transformative AI.',
    path: '/courses/governance',
    durationDescription: '25h',
    cadence: 'Cohort-based',
    additionalTag: 'Coming Jan 2026',
    isFeatured: false,
    icon: '/images/courses/ai-governance-icon.svg',
  },
];

const GRADIENT_ROTATIONS = [0, 45, 90, 135, 180];

/* Header Section */
const HeaderSection = () => (
  <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto text-center">
    <div className="flex flex-col gap-5">
      <H1 className="text-[28px] md:text-[36px] lg:text-[40px] xl:text-[48px] font-medium leading-tight tracking-[-1px]">
        Start making an impact today
      </H1>
      <P className="text-[16px] md:text-[20px] leading-[1.55] tracking-[-0.005em] opacity-70 max-w-4xl">
        Do you want to help build an awesome, safe future with AI? Apply to one of our free courses today.
        We'll help you ensure that humanity safely navigates the transition to transformative AI.
      </P>
    </div>
  </div>
);

/* Value Props Section */
const ValuePropsSection = () => (
  <div className="flex flex-col min-[680px]:flex-row justify-center gap-8 min-[680px]:gap-0 max-w-screen-xl mx-auto w-full">
    <ValueProp
      iconType="career"
      title="Build a career in AI safety, fast"
      description="25% of our graduates land impactful roles within six months of completing a course."
    />
    <div className="h-px min-[680px]:h-auto min-[680px]:w-px bg-[#13132E] opacity-20 min-[680px]:mx-8" />
    <ValueProp
      iconType="network"
      title="Get recognised in the industry"
      description="Hiring managers at all the major AI companies and governments recruit from our community."
    />
    <div className="h-px min-[680px]:h-auto min-[680px]:w-px bg-[#13132E] opacity-20 min-[680px]:mx-8" />
    <ValueProp
      iconType="expert"
      title="Join a growing global community"
      description="We host remote and in-person events all over the world every week."
    />
  </div>
);

const ValueProp = ({ iconType, title, description }: { iconType: string; title: string; description: string }) => {
  let IconComponent;
  if (iconType === 'career') {
    IconComponent = PiShieldStarLight;
  } else if (iconType === 'network') {
    IconComponent = PiShootingStarLight;
  } else {
    IconComponent = PiUsersThreeLight;
  }

  return (
    <div className="flex flex-col gap-6 min-[680px]:basis-0 min-[680px]:grow">
      <div className="size-16 rounded-full bg-[rgba(19,19,46,0.08)] flex items-center justify-center">
        <IconComponent className="size-8 text-[#13132E]" />
      </div>
      <div className="flex flex-col gap-2">
        <H4 className="text-size-md font-medium">{title}</H4>
        <P className="text-size-sm opacity-80">{description}</P>
      </div>
    </div>
  );
};

/* Course Carousel - Mobile/Tablet */
const CourseCarousel = ({
  courses,
}: {
  courses: Course[]
}) => {
  // Duplicate array for seamless loop
  const allCourses = [...courses, ...courses];

  return (
    <div className="flex lg:hidden w-screen -mx-5 overflow-hidden">
      <div
        className="flex gap-5 md:gap-6 lg:gap-8 pl-5"
        style={{
          animation: 'scroll 40s linear infinite',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.animationPlayState = 'paused';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.animationPlayState = 'running';
        }}
      >
        {allCourses.map((course, index) => {
          const originalIndex = index % courses.length;
          const copyNumber = Math.floor(index / courses.length);

          return (
            <CourseCardRedesignedWithTracking
              key={`${course.id}-copy-${copyNumber}`}
              trackingEventParams={{
                course_title: course.title,
                course_url: course.path,
              }}
              course={course}
              gradientRotation={GRADIENT_ROTATIONS[originalIndex] || 0}
              className="flex-shrink-0 w-[276px] md:w-[400px]"
              isFirstCard={course.isFeatured}
            />
          );
        })}
      </div>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}
      </style>
    </div>
  );
};

/* Course Cards Grid */
const CourseCardsGrid = ({
  featuredCourse,
  otherCourses,
}: {
  featuredCourse: Course;
  otherCourses: Course[];
}) => {
  const allCoursesForGrid = [featuredCourse, ...otherCourses.slice(0, 4)];

  const renderCard = (course: Course, index: number) => (
    <CourseCardRedesignedWithTracking
      key={course.id}
      trackingEventParams={{
        course_title: course.title,
        course_url: course.path,
      }}
      course={course}
      gradientRotation={GRADIENT_ROTATIONS[index] || 0}
      isFirstCard={index === 0}
    />
  );

  return (
    <div className="hidden lg:flex flex-col gap-8 w-full max-w-screen-xl mx-auto">
      {/* Top Row - 2 equal cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {allCoursesForGrid.slice(0, 2).map((course, i) => renderCard(course, i))}
      </div>

      {/* Bottom Row - 3 equal cards */}
      {allCoursesForGrid.length > 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {allCoursesForGrid.slice(2, 5).map((course, i) => renderCard(course, i + 2))}
        </div>
      )}
    </div>
  );
};

/* Course Card Redesigned */
const CourseCardRedesigned = ({
  course,
  gradientRotation,
  className,
  isFirstCard = false,
}: {
  course: Course;
  gradientRotation: number;
  className?: string;
  isFirstCard?: boolean;
}) => {
  const iconSrc = course.icon || '/images/logo/BlueDot_Impact_Icon_White.svg';

  return (
    <a
      href={course.path}
      className={clsx(
        'relative rounded-xl border border-[rgba(19,19,46,0.1)] overflow-hidden group cursor-pointer block',
        isFirstCard ? 'course-card--featured' : 'course-card--regular',
        className,
      )}
    >
      {/* Background Layers - All in proper stacking order */}
      {/* Layer 1: Gradient image - only scale when rotating */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          alt=""
          className="absolute inset-0 size-full object-cover"
          src="/images/courses/courses-gradient.png"
          style={{
            transform: gradientRotation === 0
              ? 'none'
              : `rotate(${gradientRotation}deg) scale(2)`, // Scale 2x for full coverage on all viewport sizes
            transformOrigin: 'center',
          }}
        />
      </div>

      {/* Layer 2: Blue overlay - always present */}
      <div className="absolute inset-0 bg-[rgba(0,51,204,0.4)] pointer-events-none" />

      {/* Layer 3: Bottom gradient - only for non-first cards */}
      {!isFirstCard && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(1, 19, 95, 0) 28.438%, rgba(1, 19, 95, 0.7) 100%)',
          }}
        />
      )}

      {/* Layer 4: Noise texture */}
      <div
        className="absolute inset-0 mix-blend-soft-light opacity-30 pointer-events-none"
        style={{
          backgroundImage: 'url(/images/agi-strategy/noise.png)',
          backgroundRepeat: 'repeat',
          backgroundSize: '464.64px 736.56px',
          backgroundPosition: 'top left',
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-[464px] sm:h-[440px] xl:h-[480px] p-6 md:p-8 lg:p-10">
        {/* Icon at top */}
        <div className="flex-grow">
          <div className="size-16 md:size-20 lg:size-24">
            <img src={iconSrc} alt="" className="block size-full" />
          </div>
        </div>

        {/* Text content at bottom */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <H3 className="text-[24px] font-[450] leading-[1.4] tracking-[-0.5px] text-white group-hover:translate-x-1 transition-transform duration-200">
              {course.title}
              {/* Hover arrow for all cards */}
              <span className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                →
              </span>
            </H3>
            <P className="text-[16px] leading-[1.55] tracking-[-0.002em] text-white">
              {course.shortDescription}
            </P>
          </div>

          <CourseTags course={course} />
        </div>
      </div>
    </a>
  );
};

const CourseCardRedesignedWithTracking = withClickTracking(CourseCardRedesigned, {
  eventName: 'course_card_click',
});

/* Course Tags */
const CourseTags = ({ course }: { course: Course }) => {
  const regularTags = [
    course.durationDescription,
    course.cadence,
    course.additionalTag,
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap gap-2">
      {regularTags.map((tag) => (
        <span
          key={tag}
          className="px-[10px] py-[5px] text-[10px] font-medium leading-[1.4] tracking-[0.5px] uppercase rounded bg-white/5 border border-white/30 backdrop-blur-[10px] text-white"
        >
          {tag}
        </span>
      ))}
      {course.isFeatured && (
        <span className="px-[10px] py-[5px] text-[10px] font-medium leading-[1.4] tracking-[0.5px] uppercase rounded bg-white text-[#001140]">
          Start here
        </span>
      )}
    </div>
  );
};

const CourseSection = () => {
  // Use hardcoded data instead of API
  const courses = HARDCODED_COURSES;
  const loading = false;

  if (loading) {
    return (
      <Section className="py-24">
        <ProgressDots />
      </Section>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  // Component determines featured course logic internally
  const featuredCourse = courses.find((course) => course.isFeatured) || courses[0];
  const otherCourses = courses
    .filter((course) => course.id !== featuredCourse?.id)
    .slice(0, 4);

  if (!featuredCourse) {
    return null;
  }

  return (
    <Section className="py-12 md:py-16 lg:py-20 xl:py-24 px-5 min-[680px]:px-8 lg:px-12 xl:px-16 2xl:px-20">
      <div className="flex flex-col items-center gap-16 lg:gap-20 xl:gap-24 2xl:gap-[120px] max-w-screen-xl mx-auto">
        {/* Header Section */}
        <HeaderSection />

        {/* Value Props Section */}
        <ValuePropsSection />

        {/* Course Cards - Responsive Layout */}
        <CourseCardsGrid
          featuredCourse={featuredCourse}
          otherCourses={otherCourses}
        />
        <CourseCarousel courses={courses} />
      </div>
    </Section>
  );
};

export default CourseSection;
