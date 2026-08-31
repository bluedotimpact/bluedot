import Head from 'next/head';
import CourseValueProps from '../components/homepage/CourseValueProps';
import MergedLadder from '../components/homepage/MergedLadder';
import StorySection from '../components/homepage/StorySection';
import HomeHeroContent from '../components/homepage/HomeHeroContent';
import TestimonialCarousel, { type TestimonialMember } from '../components/lander/TestimonialCarousel';
import EventsSection from '../components/homepage/EventsSection';
import NewsletterBanner from '../components/homepage/NewsletterBanner';
import { trpc } from '../utils/trpc';
import { linkPreviewMetaTags, LINK_PREVIEW_FALLBACK_IMAGE_URL } from '../lib/linkPreviewMetaTags';

const META_TITLE = 'BlueDot Impact | Have a positive impact on the trajectory of AI';
const META_DESCRIPTION = 'Free online courses, grants, and intensive in-person programs from the leading talent accelerator for beneficial AI and societal resilience. Join 10,000+ alumni and start today.';

const HomePage = () => {
  const { data: dbTestimonials } = trpc.testimonials.getCommunityMembers.useQuery();

  const testimonials = (dbTestimonials ?? [])
    .filter((t) => t.imageSrc)
    .map((t): TestimonialMember => ({ ...t }));

  return (
    <div>
      <Head>
        <title>{META_TITLE}</title>
        <meta name="description" content={META_DESCRIPTION} />
        <meta property="og:title" content={META_TITLE} />
        <meta property="og:description" content={META_DESCRIPTION} />
        <meta property="og:url" content="https://bluedot.org" />
        {linkPreviewMetaTags({
          imageUrl: LINK_PREVIEW_FALLBACK_IMAGE_URL, alt: 'BlueDot Impact logo', width: 1200, height: 630, imageType: 'image/png',
        })}
        <meta name="twitter:title" content={META_TITLE} />
        <meta name="twitter:description" content={META_DESCRIPTION} />
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
      <CourseValueProps />
      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />
      <MergedLadder />
      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />
      <TestimonialCarousel
        testimonials={testimonials}
        subtitle="Learn more about the incredible work our community is doing."
        variant="homepage"
        hideQuotes
        cta={{ label: 'Read alumni stories', url: '/alumni' }}
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
      <section className="w-full bd-md:py-16 bd-md:px-8 lg:py-20 lg:px-12 xl:py-24 xl:px-16 2xl:px-20">
        <div className="mx-auto max-w-screen-xl">
          <NewsletterBanner />
        </div>
      </section>
    </div>
  );
};

HomePage.pageRendersOwnNav = true;

export default HomePage;
