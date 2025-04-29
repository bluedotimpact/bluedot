import { HeroSection } from '@bluedot/ui';
import Head from 'next/head';
import RecentBlogsListSection from '../components/homepage/RecentBlogsListSection';
import CommunitySection from '../components/homepage/CommunitySection/index';
import CourseSection from '../components/homepage/CourseSection';
import FAQSection from '../components/homepage/FAQSection';
import GraduateSection from '../components/homepage/GraduateSection';
import StorySection from '../components/homepage/StorySection';
import HomeHeroContent from '../components/homepage/HomeHeroContent';

const HomePage = () => {
  return (
    <div>
      <Head>
        <title>BlueDot Impact | Industry-leading free AI courses and career support</title>
        <meta name="description" content="Learn for free about AI safety and how to ensure humanity safely navigates the transition to transformative AI. Join 4,000+ professionals building careers at organizations like Anthropic, OpenAI, and the UK’s AI Safety Institute." />
      </Head>
      <HeroSection>
        <HomeHeroContent />
      </HeroSection>
      <GraduateSection />
      <CourseSection />
      <CommunitySection />
      <StorySection />
      <RecentBlogsListSection />
      <FAQSection />
    </div>
  );
};

export default HomePage;
