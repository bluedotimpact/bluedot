import {
  HeroSection,
  HeroH1,
  HeroH2,
} from '@bluedot/ui';
import Head from 'next/head';
import BlogSection from '../components/homepage/BlogSection';
import CommunitySection from '../components/homepage/CommunitySection/index';
import CourseSection from '../components/homepage/CourseSection';
import FAQSection from '../components/homepage/FAQSection';
import GraduateSection from '../components/homepage/GraduateSection';
import StorySection from '../components/homepage/StorySection';
import { ROUTES } from '../lib/routes';

const CURRENT_ROUTE = ROUTES.home;

const HomePage = () => {
  return (
    <div>
      <Head>
        <title>{CURRENT_ROUTE.title} | Industry-leading free AI courses and career support</title>
        <meta name="description" content="Learn for free about AI safety and how to ensure humanity safely navigates the transition to transformative AI. Join 4,000+ professionals building careers at organizations like Anthropic, OpenAI, and the UK’s AI Safety Institute." />
      </Head>
      <HeroSection className="py-12">
        <div className="hero-section__logo-container flex flex-col items-center gap-7 mb-3">
          <img className="hero-section__logo-icon w-20 mb-20" src="/images/logo/BlueDot_Impact_Icon_White.svg" alt="BlueDot Impact" />
        </div>
        <HeroH1>The expertise you need to shape safe AI</HeroH1>
        <HeroH2>Learn alongside thousands of professionals through comprehensive courses designed with leading AI safety experts.</HeroH2>
      </HeroSection>
      <GraduateSection />
      <CourseSection />
      <CommunitySection />
      <StorySection />
      <BlogSection />
      <FAQSection />
    </div>
  );
};

export default HomePage;
