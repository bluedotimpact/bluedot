import Head from 'next/head';
import CourseSection from '../components/homepage/CourseSection';
import StorySection from '../components/homepage/StorySection';
import HomeHeroContent from '../components/homepage/HomeHeroContent';
import HomepageBlogSection from '../components/homepage/HomepageBlogSection';
import CommunityCarousel, { CommunityMember } from '../components/lander/CommunityCarousel';
import EventsSection from '../components/homepage/EventsSection';
import NewsletterBanner from '../components/homepage/NewsletterBanner';
import { trpc } from '../utils/trpc';

// TODO: Remove once more testimonials are added to Airtable
const FALLBACK_COMMUNITY_MEMBERS = [
  {
    name: 'Neel Nanda',
    jobTitle: 'Mech Interp Lead at Google DeepMind',
    course: 'Former participant and facilitator',
    imageSrc: '/images/graduates/neel.webp',
    url: 'https://www.neelnanda.io/about',
  },
  {
    name: 'Catherine Fist',
    jobTitle: 'Head of Delivery at UK AISI',
    course: 'AI Governance Course Graduate',
    imageSrc: '/images/graduates/catherine.webp',
    url: 'https://www.linkedin.com/in/catherine-fist/',
  },
  {
    name: 'Adam Jones',
    jobTitle: 'Member of Technical Staff at Anthropic',
    course: 'Former AI safety lead at BlueDot',
    imageSrc: '/images/graduates/adam.webp',
    url: 'https://adamjones.me/',
  },
  {
    name: 'Marius Hobbhahn',
    jobTitle: 'CEO at Apollo Research',
    course: 'AI Alignment Course Graduate',
    imageSrc: '/images/graduates/marius.webp',
    url: 'https://www.mariushobbhahn.com/aboutme/',
  },
  {
    name: 'Chiara Gerosa',
    jobTitle: 'Executive Director at Talos',
    course: 'AI Governance Course Facilitator',
    imageSrc: '/images/graduates/chiara.webp',
    url: 'https://www.linkedin.com/in/chiaragerosa/',
  },
  {
    name: 'Richard Ngo',
    jobTitle: 'Former OpenAI and DeepMind',
    course: 'AI Alignment Course Designer',
    imageSrc: '/images/graduates/richard.webp',
    url: 'https://www.richardcngo.com/',
  },
];

const MIN_TESTIMONIALS_COUNT = 4;

const HomePage = () => {
  const { data: dbTestimonials, isLoading } = trpc.testimonials.getCommunityMembers.useQuery();

  // TODO: Remove fallback once we have enough testimonials in Airtable (at least 4)
  const hasEnoughTestimonials = !isLoading && dbTestimonials && dbTestimonials.length >= MIN_TESTIMONIALS_COUNT;
  // TODO: Remove Array.isArray check once database schema is synced to use text instead of text[]
  const communityMembers = hasEnoughTestimonials
    ? dbTestimonials.map((t): CommunityMember => {
      const headshot = t.headshotAttachmentUrls;
      return {
        name: t.name!,
        jobTitle: t.jobTitle ?? '',
        course: '',
        imageSrc: Array.isArray(headshot) ? headshot[0]! : headshot?.split(' ')[0] ?? '',
        url: t.profileUrl ?? undefined,
      };
    })
    : FALLBACK_COMMUNITY_MEMBERS;

  return (
    <div className="bg-white">
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
      <CommunityCarousel
        members={communityMembers}
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
