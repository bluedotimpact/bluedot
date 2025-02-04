import CourseSection from '../components/homepage/CourseSection';
import GraduateSection from '../components/homepage/GraduateSection';
import StorySection from '../components/homepage/StorySection';
import CommunitySection from '../components/homepage/CommunitySection/index';

const HomePage = () => {
  return (
    <div>
      <GraduateSection />
      <CourseSection />
      <StorySection />
      <CommunitySection />
    </div>
  );
};

export default HomePage;
