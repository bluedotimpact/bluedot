import Head from 'next/head';
import CourseSection from '../components/homepage/CourseSection';
import StorySection from '../components/homepage/StorySection';
import HomeHeroContent from '../components/homepage/HomeHeroContent';
import HomepageBlogSection from '../components/homepage/HomepageBlogSection';
import CommunityCarousel from '../components/shared/CommunityCarousel';
import EventsSection from '../components/homepage/EventsSection';

const COMMUNITY_MEMBERS = [
  {
    name: 'Neel Nanda',
    jobTitle: 'Mech Interp Lead at Google DeepMind',
    course: 'Former participant and facilitator',
    imageSrc: '/images/graduates/neel.jpeg',
    url: 'https://www.neelnanda.io/about',
  },
  {
    name: 'Catherine Fist',
    jobTitle: 'Head of Delivery at UK AISI',
    course: 'AI Governance Course Graduate',
    imageSrc: '/images/graduates/catherine.jpeg',
    url: 'https://www.linkedin.com/in/catherine-fist/',
  },
  {
    name: 'Adam Jones',
    jobTitle: 'Member of Technical Staff at Anthropic',
    course: 'Former AI safety lead at BlueDot',
    imageSrc: '/images/graduates/adam.jpg',
    url: 'https://adamjones.me/',
  },
  {
    name: 'Marius Hobbhahn',
    jobTitle: 'CEO at Apollo Research',
    course: 'AI Alignment Course Graduate',
    imageSrc: '/images/graduates/marius.jpeg',
    url: 'https://www.mariushobbhahn.com/aboutme/',
  },
  {
    name: 'Chiara Gerosa',
    jobTitle: 'Executive Director at Talos',
    course: 'AI Governance Course Facilitator',
    imageSrc: '/images/graduates/chiara.jpeg',
    url: 'https://www.linkedin.com/in/chiaragerosa/',
  },
  {
    name: 'Richard Ngo',
    jobTitle: 'Former OpenAI and DeepMind',
    course: 'AI Alignment Course Designer',
    imageSrc: '/images/graduates/richard.jpg',
    url: 'https://www.richardcngo.com/',
  },
];

const HomePage = () => {
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
      <CommunityCarousel
        members={COMMUNITY_MEMBERS}
        subtitle="Learn more about the incredible work our community is doing."
        variant="homepage"
      />
      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />
      <EventsSection />
      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />
      <StorySection />
      <HomepageBlogSection maxItems={3} />
    </div>
  );
};

export default HomePage;
