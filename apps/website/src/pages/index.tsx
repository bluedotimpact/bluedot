import { HeroSection } from '@bluedot/ui';
import Head from 'next/head';
import CommunitySection from '../components/homepage/CommunitySection/index';
import CourseSection from '../components/homepage/CourseSection';
import FAQSection from '../components/homepage/FAQSection';
import GraduateSection from '../components/homepage/GraduateSection';
import StorySection from '../components/homepage/StorySection';
import HomeHeroContent from '../components/homepage/HomeHeroContent';
import BlogListSection from '../components/blog/BlogListSection';

const HomePage = () => {
  return (
    <div>
      <Head>
        <title>BlueDot Impact | Industry-leading free AI courses and career support</title>
        <meta name="description" content="Learn for free about AI safety and how to ensure humanity safely navigates the transition to transformative AI. Join 4,000+ professionals building careers at organizations like Anthropic, OpenAI, and the UK’s AI Safety Institute." />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'BlueDot Impact',
              url: 'https://bluedot.org',
              logo: 'https://bluedot.org/images/logo/icon-on-blue.svg',
              naics: '611430',
              sameAs: [
                'https://twitter.com/bluedotimpact',
                'https://linkedin.com/company/bluedotimpact',
                'https://github.com/bluedotimpact',
                'https://www.youtube.com/@bluedotimpact',
                'https://www.instagram.com/bluedotimpact',
                'https://www.facebook.com/bluedotimpact',
                'https://www.tiktok.com/@bluedotimpact',
              ],
            }),
          }}
        />
      </Head>
      <HeroSection>
        <HomeHeroContent />
      </HeroSection>
      <GraduateSection />
      <CourseSection />
      <CommunitySection />
      <StorySection />
      <BlogListSection maxItems={3} />
      <FAQSection />
    </div>
  );
};

export default HomePage;
