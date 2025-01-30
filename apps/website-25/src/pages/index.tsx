import {
  HeroSection,
} from '@bluedot/ui';
import CourseSection from '../components/homepage/CourseSection';
import GraduateSection from '../components/homepage/GraduateSection';
import StorySection from '../components/homepage/StorySection';
import CommunitySection from '../components/homepage/CommunitySection/index';

const HomePage = () => {
  return (
    <div>
      <HeroSection
        title="The expertise you need to shape safe AI "
        subtitle="We run the world's most trusted AI Safety educational courses, career services and support community. Our programs are developed in collaboration with AI Safety world experts."
      >
        <div className="hero-section__logo-container flex flex-col items-center gap-7 mb-3">
          <img className="hero-section__logo-icon w-20 mb-20" src="/images/logo/BlueDot_Impact_Icon_White.svg" alt="BlueDot Impact" />
        </div>
      </HeroSection>
      <GraduateSection />
      <CourseSection />
      <StorySection />
      <CommunitySection />
    </div>
  );
};

export default HomePage;
