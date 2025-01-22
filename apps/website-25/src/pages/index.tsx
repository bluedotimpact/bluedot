import {
  Banner,
  CourseCard,
  HeroSection,
} from '@bluedot/ui';
import CourseSection from '../components/homepage/CourseSection';
import GraduateSection from '../components/homepage/GraduateSection';
import StorySection from '../components/homepage/StorySection';

const HomePage = () => {
  return (
    <div>
      <HeroSection
        className="!items-end pb-14"
        title="The expertise you need to shape safe AI "
        subtitle="We run the world's most trusted AI Safety educational courses, career services and support community. Our programs are developed in collaboration with AI Safety world experts."
      >
        <div className="hero-section__logo-container flex flex-col items-center gap-7 mb-3">
          <img className="hero-section__logo-icon w-20" src="/images/logo/BlueDot_Impact_Icon.svg" alt="BlueDot Impact" />
          <img className="hero-section__logo-text w-52 mr-9" src="/images/logo/BlueDot_Impact_Logo_Text-Only.svg" alt="BlueDot Impact" />
        </div>
      </HeroSection>
      <div>
        <Banner
          title="Subscribe to our newsletter for the latest updates on AI safety careers"
          showInput
          showButton
        />
      </div>
      <GraduateSection />
      <CourseSection />
      <StorySection />
    </div>
  );
};

export default HomePage;
