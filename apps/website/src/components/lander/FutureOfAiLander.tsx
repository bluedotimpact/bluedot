import Head from 'next/head';
import {
  Card,
  CTALinkOrButton,
  Section,
  SlideList,
  QuoteCarousel,
  type Quote,
} from '@bluedot/ui';
import {
  HeroH1,
  HeroMiniTitle,
  HeroCTAContainer,
  HeroSection,
} from '@bluedot/ui/src/HeroSection';
import {
  FaAward,
  FaBoltLightning,
  FaLightbulb,
} from 'react-icons/fa6';
import { isMobile } from 'react-device-detect';

import { GetCourseResponse } from '../../pages/api/courses/[courseSlug]';
import { H3 } from '../Text';
import TestimonialSubSection, { Testimonial } from '../homepage/CommunitySection/TestimonialSubSection';
import { CourseUnitsSection } from '../courses/CourseUnitsSection';

const FutureOfAiBanner = ({ title, ctaUrl }: { title: string, ctaUrl: string }) => {
  return (
    <div className="future-of-ai-lander__banner relative flex flex-col md:flex-row gap-6 items-center justify-center w-full p-12 text-center bg-bluedot-lighter">
      <H3 className="future-of-ai-lander__banner-title">{title}</H3>
      <CTALinkOrButton className="future-of-ai-lander__banner-cta" url={ctaUrl} withChevron>
        Start learning for free
      </CTALinkOrButton>
    </div>
  );
};

const customTitle = 'AI is shaping the future. So can you.';
const customDescription = 'A free 2-hour course that explains AI simply — empowering you to help build a future that works for all of us.';

const quotes: Quote[] = [
  {
    quote: 'AI could surpass almost all humans at almost everything shortly after 2027.',
    name: 'Dario Amodei',
    role: 'CEO, Anthropic',
    imageSrc: '/images/lander/foai/dario.jpeg',
  },
  {
    quote: 'We must take the risks of AI as seriously as other major global challenges, like climate change.',
    name: 'Demis Hassabis',
    role: 'CEO, Google DeepMind',
    imageSrc: '/images/lander/foai/demis.jpeg',
  },
  {
    quote: 'Sh–, what the f—?',
    name: 'Snoop Dogg',
    role: 'The Doggfather',
    imageSrc: '/images/lander/foai/snoop.jpg',
  },
];

const callouts = [
  {
    title: 'Wondering how AI will transform your work and everyday life?',
    imageSrc: '/images/beliefs/agi.png',
  },
  {
    title: 'Do you want to see what cutting-edge AI systems can do today?',
    imageSrc: '/images/beliefs/powering.png',
  },
  {
    title: 'Curious about how AI will reshape our world in the coming years?',
    imageSrc: '/images/beliefs/matters.png',
  },
];

const testimonials: Testimonial[] = [
  {
    quote: 'I recommend the course for everyone who is interested in the future of AI, and wants to think seriously about the implications of this technology.',
    name: 'Craig Dickson',
    role: 'Senior Data Analyst, Klarna',
    imageSrc: '/images/graduates/craig.png',
  },
  {
    quote: 'The course also gave me something I didn\'t expect: a global community of changemakers, dreamers and thinkers.',
    name: 'Crystal Isanda',
    role: 'Foresight Fellow, UNICEF',
    imageSrc: '/images/graduates/crystal.jpeg',
  },
  {
    quote: 'This course is excellent for any skill level. AI Safety should be our collective goal and BlueDot Impact is doing just that one cohort at a time.',
    name: 'Vipul Gupta',
    role: 'Senior Software Engineer, Balena',
    imageSrc: '/images/graduates/vipul.png',
  },
];

const FutureOfAiLander = ({
  courseData,
}: { courseData: GetCourseResponse }) => {
  return (
    <>
      <Head>
        <title>{courseData?.course.title} | BlueDot Impact</title>
        <meta name="description" content={customDescription} />
      </Head>

      {/* Hero section */}
      <HeroSection>
        <HeroMiniTitle>{courseData?.course.title}</HeroMiniTitle>
        <HeroH1>{customTitle}</HeroH1>
        <p className="text-color-text-on-dark text-center mt-4">{customDescription}</p>
        <div className="flex flex-row flex-wrap justify-center gap-2 items-center mt-4">
          <div className="flex gap-2 items-center border border-color-border rounded-lg p-4 text-color-text-on-dark">
            <FaBoltLightning /> 2 hours
          </div>
          <div className="flex gap-2 items-center border border-color-border rounded-lg p-4 text-color-text-on-dark">
            <FaAward /> Free certification
          </div>
          <div className="flex gap-2 items-center border border-color-border rounded-lg p-4 text-color-text-on-dark">
            <FaLightbulb /> No experience required
          </div>
        </div>
        {courseData.units?.[0]?.path && (
          <HeroCTAContainer>
            <CTALinkOrButton url={courseData.units[0].path} withChevron>Start learning for free</CTALinkOrButton>
          </HeroCTAContainer>
        )}
      </HeroSection>

      {/* Quotes section */}
      <Section>
        <QuoteCarousel className="future-of-ai-lander__quotes" quotes={quotes} />
      </Section>

      {/* Graduate section */}
      {/* <GraduateSection /> */}

      {/* Callouts section */}
      <Section>
        <SlideList
          maxItemsPerSlide={3}
          className="future-of-ai-lander__callouts"
        >
          {callouts.map((callout) => (
            <Card key={callout.title} title={callout.title} imageSrc={callout.imageSrc} className="future-of-ai-lander__callout" />
          ))}
        </SlideList>
      </Section>

      <FutureOfAiBanner title="Try it yourself, get certified, and join the movement today:" ctaUrl={courseData.units?.[0]?.path ?? ''} />

      {/* Units section */}
      <CourseUnitsSection units={courseData.units} />

      {/* Testimonials section */}
      <Section>
        {isMobile ? (
          <QuoteCarousel quotes={testimonials} />
        ) : (
          <TestimonialSubSection testimonials={testimonials} />
        )}
      </Section>

      {/* Banner section */}
      <FutureOfAiBanner title="Ready to have a say in your future?" ctaUrl={courseData.units?.[0]?.path ?? ''} />
    </>
  );
};

export default FutureOfAiLander;
