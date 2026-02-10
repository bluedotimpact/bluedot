import Head from 'next/head';
import CourseSection from '../components/homepage/CourseSection';
import StorySection from '../components/homepage/StorySection';
import HomeHeroContent from '../components/homepage/HomeHeroContent';
import HomepageBlogSection from '../components/homepage/HomepageBlogSection';
import TestimonialCarousel, { type TestimonialMember } from '../components/lander/TestimonialCarousel';
import EventsSection from '../components/homepage/EventsSection';
import NewsletterBanner from '../components/homepage/NewsletterBanner';
import { trpc } from '../utils/trpc';

const HomePage = () => {
  const { data: dbTestimonials } = trpc.testimonials.getCommunityMembers.useQuery();

  const testimonials = dbTestimonials?.map((t): TestimonialMember => ({ ...t })) ?? [];

  return (
    <div className="bg-white">
      <Head>
        <title>BlueDot Impact | Industry-leading free AI courses and career support</title>
        <meta name="description" content="Learn for free about AI safety and how to ensure humanity safely navigates the transition to transformative AI. Join 4,000+ professionals building careers at organizations like Anthropic, OpenAI, and the UK’s AI Safety Institute." />
        <script
          type="application/ld+json"

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
      <HomeHeroContent />
      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />
      <CourseSection />
      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />
      <EventsSection />
      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />
      <StorySection />
      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />
      <HomepageBlogSection maxItems={3} />
      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />
      <TestimonialCarousel
        testimonials={testimonials}
        subtitle="Learn more about the incredible work our community is doing."
        variant="homepage"
      />
      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />
      {/* Newsletter Section */}
      <section className="w-full bg-white min-[680px]:py-16 min-[680px]:px-8 min-[1024px]:py-20 min-[1024px]:px-12 min-[1280px]:py-24 min-[1280px]:px-16 2xl:px-20">
        <div className="mx-auto max-w-screen-xl">
          <NewsletterBanner />
        </div>
      </section>
    </div>
  );
};

export default HomePage;
