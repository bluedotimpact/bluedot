import {
  CourseCard,
  HeroSection,
} from '@bluedot/ui';

const HomePage = () => {
  return (
    <div>
      <HeroSection
        title="The expertise you need to shape safe AI "
        subtitle="We run the world's most trusted AI Safety educational courses, career services and support community. Our programs are developed in collaboration with AI Safety world experts."
      >
        <p className="text-center">BlueDot Impact</p>
      </HeroSection>

      {/* COURSES */}
      <div className="mx-16 my-8">
        <div className="ml-4">
          <h2 className="text-bluedot-normal text-[48px] mb-4 font-serif font-extrabold leading-none
                                relative after:content-[''] after:absolute after:top-1/2 after:ml-3 after:h-[2px] after:w-full after:bg-bluedot-normal"
          >
            Our courses
          </h2>
          <p className="text-bluedot-darker text-md mb-4">We run inclusive, blended learning courses that cater to various expertise levels and time availability</p>
        </div>
        <div className="flex flex-row gap-4">
          <CourseCard
            title="Alignment Fast Track"
            description="AI systems are rapidly becoming more capable and more general. Despite AI’s potential to radically improve human society, there are still open questions about how we build AI systems that are controllable, aligned with our intentions and interpretable."
            courseType="Crash course"
            image="/images/intro-course.png"
          />
          <CourseCard
            title="Governance Fast-Track"
            description="Despite AI’s potential to radically improve human society, there are still active debates about how we will wield the AI systems of today and tomorrow. The rise of this powerful technology demands a thoughtful approach to its governance and regulation."
            courseType="Crash course"
            image="/images/governance-course.jpg"
          />
          <CourseCard
            title="AI Alignment"
            description="AI systems are rapidly becoming more capable and more general. Despite AI’s potential to radically improve human society, there are still open questions about how we build AI systems that are controllable, aligned with our intentions and interpretable."
            courseType="In-depth course"
            image="/images/alignment-course.png"
          />
          <CourseCard
            title="AI Governance"
            description="The rise of any powerful technology demands a thoughtful approach to its governance and regulation. There has been increasing interest in how AI governance can and should mitigate extreme risks from AI, but it can be difficult to get up to speed on research and ideas in this area."
            courseType="In-depth course"
            image="/images/governance-course.jpg"
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
