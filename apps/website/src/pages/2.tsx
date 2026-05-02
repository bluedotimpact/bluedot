import Head from 'next/head';
import StorySection from '../components/homepage/StorySection';
import HomeHeroContent from '../components/homepage/HomeHeroContent';
import TestimonialCarousel, { type TestimonialMember } from '../components/lander/TestimonialCarousel';
import EventsSection from '../components/homepage/EventsSection';
import NewsletterBanner from '../components/homepage/NewsletterBanner';
import LadderSection from '../components/homepage/variants/LadderSection';
import { trpc } from '../utils/trpc';

const META_TITLE = 'Variant 2 — Three-rung ladder | BlueDot Impact';

const VariantTwo = () => {
  const { data: dbTestimonials } = trpc.testimonials.getCommunityMembers.useQuery();
  const testimonials = dbTestimonials?.map((t): TestimonialMember => ({ ...t })) ?? [];

  return (
    <div>
      <Head>
        <title>{META_TITLE}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <HomeHeroContent />
      <div className="border-t-hairline border-color-divider" />
      <LadderSection />
      <div className="border-t-hairline border-color-divider" />
      <TestimonialCarousel
        testimonials={testimonials}
        subtitle="Learn more about the incredible work our community is doing."
        variant="homepage"
        hideQuotes
      />
      <div className="border-t-hairline border-color-divider" />
      <EventsSection />
      <div className="border-t-hairline border-color-divider" />
      <StorySection />
      <div className="border-t-hairline border-color-divider" />
      <section className="w-full bd-md:py-16 bd-md:px-8 lg:py-20 lg:px-12 xl:py-24 xl:px-16 2xl:px-20">
        <div className="mx-auto max-w-screen-xl">
          <NewsletterBanner />
        </div>
      </section>
    </div>
  );
};

VariantTwo.pageRendersOwnNav = true;

export default VariantTwo;
