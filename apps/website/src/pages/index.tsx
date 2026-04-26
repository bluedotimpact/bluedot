import Head from 'next/head';
import CourseSection from '../components/homepage/CourseSection';
import GrantsSection from '../components/homepage/GrantsSection';
import StorySection from '../components/homepage/StorySection';
import HomeHeroContent from '../components/homepage/HomeHeroContent';
import TestimonialCarousel, { type TestimonialMember } from '../components/lander/TestimonialCarousel';
import EventsSection from '../components/homepage/EventsSection';
import NewsletterBanner from '../components/homepage/NewsletterBanner';
import { trpc } from '../utils/trpc';

const META_TITLE = 'BlueDot Impact | Have a positive impact on the trajectory of AI';
const META_DESCRIPTION = 'Free courses, career support, and entrepreneur programs from the leading talent accelerator for beneficial AI and societal resilience. Join 7,000+ alumni and start today.';
const LINK_PREVIEW_IMAGE = 'https://bluedot.org/images/logo/link-preview-fallback.png';

const HomePage = () => {
  const { data: dbTestimonials } = trpc.testimonials.getCommunityMembers.useQuery();

  const testimonials = dbTestimonials?.map((t): TestimonialMember => ({ ...t })) ?? [];

  return (
    <div className="bg-white">
      <Head>
        <title>{META_TITLE}</title>
        <meta name="description" content={META_DESCRIPTION} />
        <meta property="og:title" content={META_TITLE} />
        <meta property="og:description" content={META_DESCRIPTION} />
        <meta property="og:site_name" content="BlueDot Impact" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bluedot.org" />
        <meta property="og:image" content={LINK_PREVIEW_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:alt" content="BlueDot Impact logo" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={META_TITLE} />
        <meta name="twitter:description" content={META_DESCRIPTION} />
        <meta name="twitter:image" content={LINK_PREVIEW_IMAGE} />
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
      <GrantsSection />
      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />
      <TestimonialCarousel
        testimonials={testimonials}
        subtitle="Learn more about the incredible work our community is doing."
        variant="homepage"
      />
      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />
      <EventsSection />
      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />
      <StorySection />
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

HomePage.pageRendersOwnNav = true;

export default HomePage;
