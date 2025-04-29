import Head from 'next/head';
import { isMobile } from 'react-device-detect';
import clsx from 'clsx';
import {
  CTALinkOrButton,
  Section,
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

import { GetCourseResponse } from '../../pages/api/courses/[courseSlug]';
import { H1, H2, H3 } from '../Text';
import TestimonialSubSection, { Testimonial } from '../homepage/CommunitySection/TestimonialSubSection';
import GraduateSection from '../homepage/GraduateSection';

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
    quote: 'We should not underestimate the real threats coming from AI... we have a narrowing window of opportunity to guide this technology responsibly.',
    name: 'Ursula von der Leyen',
    role: 'President, European Commission',
    imageSrc: '/images/lander/foai/ursula.png',
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

const features = [
  {
    title: 'No-Nonsense Learning',
    description: 'Lost in AI buzzwords? Our bite-sized modules transform complex concepts into clear language. You\'ll quickly build the vocabulary to discuss AI confidently at work and with friends.',
    ctaText: 'Start learning for free',
    desktopImageSrc: '/images/lander/foai/learn-desktop.png',
    mobileImageSrc: '/images/lander/foai/learn-mobile.png',
  },
  {
    title: 'Try it yourself',
    description: 'Don\'t just read about AI—use it. Our interactive demos let you create with cutting-edge tools right in your browser.',
    ctaText: 'Experience AI',
    desktopImageSrc: '/images/lander/foai/try-desktop.png',
    mobileImageSrc: '/images/lander/foai/try-mobile.png',
  },
  {
    title: 'Join the community',
    description: 'Turn individual concern into collective impact. Connect with thousands working toward safe and secure AI.',
    ctaText: 'Get connected',
    desktopImageSrc: '/images/lander/foai/community-desktop.png',
    mobileImageSrc: '/images/lander/foai/community-mobile.png',
  },
  {
    title: 'Get certified',
    description: 'Prove your AI knowledge without a lengthy degree. Our industry-recognised certificate demonstrates your understanding of AI\'s foundations and implications.',
    ctaText: 'Get certified for free',
    desktopImageSrc: '/images/lander/foai/cert-desktop.png',
    mobileImageSrc: '/images/lander/foai/cert-mobile.png',
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
      {isMobile ? (
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
      ) : (
        <div className="flex flex-row justify-center items-center w-full py-12 px-spacing-x bg-color-canvas relative">
          <div className="future-of-ai-lander__hero-container flex flex-row justify-between items-center w-max-width px-spacing-x">
            <div className="
              future-of-ai-lander__hero-content flex flex-col items-start w-1/2 max-w-[555px] z-10
              after:content-[''] after:-z-10 after:absolute after:bg-bluedot-darker after:size-full after:top-0 after:right-[45%] after:-skew-x-[10deg]"
            >
              <H1 className="text-color-text-on-dark uppercase tracking-wider text-size-sm font-semibold mb-4">{courseData?.course.title}</H1>
              <H2 className="text-color-text-on-dark bluedot-h1">{customTitle}</H2>
              <p className="text-color-text-on-dark mt-4">{customDescription}</p>
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
            </div>
            <QuoteCarousel className="future-of-ai-lander__hero-quotes text-color-text w-1/2 max-w-[555px] z-10 pl-12" quotes={quotes} />
          </div>
        </div>
      )}

      {/* Graduate section */}
      <GraduateSection />

      {/* Features section */}
      <Section>
        <div className="future-of-ai-lander__features-section w-full flex flex-col justify-center gap-12 items-center mt-4 mx-auto">
          {features.map((feature, index) => (
            <div key={feature.title} className="future-of-ai-lander__features-section-item flex flex-col md:flex-row justify-center gap-12 items-center mt-4">
              <img
                src={isMobile ? feature.mobileImageSrc : feature.desktopImageSrc}
                alt={feature.title}
                className={clsx(
                  'future-of-ai-lander__feature-image',
                  index % 2 === 0 ? 'md:order-1' : 'md:order-2',
                  'h-[340px] md:h-[550px] w-full overflow-hidden object-cover object-top',
                )}
              />
              <div className={`future-of-ai-lander__feature-content flex flex-col gap-2 items-start max-w-[300px] ${index % 2 === 0 ? 'md:order-2' : 'md:order-1'}`}>
                <H3>{feature.title}</H3>
                <p>{feature.description}</p>
                <CTALinkOrButton className="future-of-ai-lander__feature-cta mt-4" url={courseData.units?.[0]?.path ?? ''} withChevron>
                  {feature.ctaText}
                </CTALinkOrButton>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Testimonials */}
      <Section title="What our graduates say" titleLevel="h3">
        {isMobile ? (
          <QuoteCarousel quotes={testimonials} />
        ) : (
          <TestimonialSubSection testimonials={testimonials} />
        )}
      </Section>

      {/* Banner */}
      <FutureOfAiBanner title="Ready to have a say in your future?" ctaUrl={courseData.units?.[0]?.path ?? ''} />
    </>
  );
};

export default FutureOfAiLander;
