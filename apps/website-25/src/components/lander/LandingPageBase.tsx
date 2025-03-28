import {
  CTALinkOrButton,
  Footer,
} from '@bluedot/ui';
import Head from 'next/head';
import { ROUTES } from '../../lib/routes';
import Container from './Container';
import NewNav, { NewNavItem, NewNavButton } from './NewNav';
import SingleTestimonialSection, {
  TestimonialQuote,
  TestimonialAttribution,
  TestimonialCTA,
} from './SingleTestimonialSection';
import FeaturesSection, { Feature, FeatureTitle, FeatureSubtitle } from './FeaturesSection';
import CourseUnitsSection, {
  CourseUnit, CourseUnitTitle, CourseUnitDescription,
} from './CourseUnitsSection';
import BlueHeader from './BlueHeader';
import { getCtaUrl } from './getCtaUrl';
import GraduateSection from '../homepage/GraduateSection';

export type LandingPageBaseProps = {
  /** Hero component to render */
  hero: React.ReactNode,
  /** Variant name, used for analytics */
  variant: string,
};

const LandingPageBase: React.FC<LandingPageBaseProps> = ({ hero, variant }) => {
  const ctaUrl = getCtaUrl(variant);

  return (
    <div className="min-h-screen bg-cream-normal">
      <Head>
        <title>BlueDot Impact | Future-proof your career</title>
        <meta name="description" content="No jargon, no coding, no pre-requisites – just bring your curiosity for how AI will reshape your world." />
      </Head>
      <NewNav>
        <NewNavItem href="https://course.bluedot.org/login">Login</NewNavItem>
        <NewNavButton url={ctaUrl}>Sign up for free</NewNavButton>
      </NewNav>
      {hero}

      <Container>
        <GraduateSection />
      </Container>
      <Container className="flex gap-6 sm:gap-12 md:gap-20 items-center">
        <div>
          {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
          <h2 className="text-3xl mt-10">AI is reshaping our world</h2>
          <p className="text-size-md mt-6">In 2019, AI could barely write a coherent paragraph. Today, it writes code, creates videos, and helps millions with their daily work.</p>
          <p className="text-size-md mt-6 mb-16">By 2030, AI systems may match or exceed human performance across most intellectual tasks - transforming every industry and profession.</p>
        </div>
        <div className="w-32 sm:w-40 md:w-60 shrink-0">
          <img src="/images/lander/ai_reshaping_icons.svg" alt="" className="my-10 w-full" />
        </div>
      </Container>

      <Container bgClassname="bg-bluedot-lighter" className="py-16">
        <SingleTestimonialSection imgSrc="/images/graduates/crystal.jpeg">
          <TestimonialQuote>
            It didn't just teach me about AI safety; it clarified my purpose.
          </TestimonialQuote>
          <TestimonialAttribution>
            ~Crystal Isanda, Foresight Fellow @Unicef
          </TestimonialAttribution>
          <TestimonialCTA url={ctaUrl}>
            Start learning with 4000+ others
          </TestimonialCTA>
        </SingleTestimonialSection>
      </Container>

      <Container className="py-16">
        <BlueHeader>Why take the course?</BlueHeader>
        <FeaturesSection>
          <Feature iconSrc="/images/lander/icon_interact.svg">
            <FeatureTitle>Try the latest AI tools</FeatureTitle>
            <FeatureSubtitle>Learn how today's AI actually works</FeatureSubtitle>
          </Feature>
          <Feature iconSrc="/images/lander/icon_book.svg">
            <FeatureTitle>Go beyond headlines</FeatureTitle>
            <FeatureSubtitle>Understand the future trajectory of AI</FeatureSubtitle>
          </Feature>
          <Feature iconSrc="/images/lander/icon_globe.svg">
            <FeatureTitle>Shape AI's development</FeatureTitle>
            <FeatureSubtitle>Use your skills and voice for good</FeatureSubtitle>
          </Feature>
        </FeaturesSection>
      </Container>

      {/* Course Units Section */}
      <Container bgClassname="bg-bluedot-lighter" className="py-16">
        <BlueHeader>What's covered?</BlueHeader>
        <CourseUnitsSection>
          <CourseUnit unitNumber="1">
            <CourseUnitTitle>AI Agents & What They Can Do</CourseUnitTitle>
            <CourseUnitDescription>See how smart AI assistants are making work-optional futures possible for the first time and how they're already changing everyday tasks.</CourseUnitDescription>
          </CourseUnit>
          <CourseUnit unitNumber="2">
            <CourseUnitTitle>Getting Your Time Back</CourseUnitTitle>
            <CourseUnitDescription>Try practical AI tools that can save you 10+ hours every week by handling your most boring tasks, freeing you to do what really matters.</CourseUnitDescription>
          </CourseUnit>
          <CourseUnit unitNumber="3">
            <CourseUnitTitle>Two Possible Futures</CourseUnitTitle>
            <CourseUnitDescription>Learn about the key choices that will decide whether technology makes life better for everyone or just benefits a few powerful groups.</CourseUnitDescription>
          </CourseUnit>
          <CourseUnit unitNumber="4">
            <CourseUnitTitle>Be Part of the Change</CourseUnitTitle>
            <CourseUnitDescription>Discover how you can help shape these technologies in your community and workplace, and join others working toward a better future.</CourseUnitDescription>
          </CourseUnit>
        </CourseUnitsSection>
        <div className="flex justify-center mt-8">
          <CTALinkOrButton url={ctaUrl}>Sign up for free</CTALinkOrButton>
        </div>
      </Container>

      <Container className="py-16">
        <BlueHeader className="!text-left">You're in good hands</BlueHeader>
        <div className="w-3/4">
          <p className="mb-4 text-size-md">
            We started BlueDot to help others understand and work on challenges from emerging technologies.
          </p>
          <p className="mb-8 text-size-md">
            Since 2021, we've designed our courses with some of the world's leading experts and helped thousands of talented people build the skills to make a real difference.
          </p>
          <CTALinkOrButton variant="secondary" url={ROUTES.about.url}>Read about us</CTALinkOrButton>
        </div>
        <div className="flex justify-end mt-0 md:-mt-16 pointer-events-none">
          <img src="/images/lander/signed_dewi_and_will.svg" alt="Dewi and Will, BlueDot Co-Founders" className="w-2/3" />
        </div>
      </Container>

      <Container bgClassname="bg-bluedot-darker" className="py-16">
        <div className="flex items-start justify-between">
          <div className="w-full md:w-3/4 space-y-4">
            {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
            <h2 className="text-3xl font-bold font-serif text-white">
              Want a f*ing awesome future?
            </h2>
            {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
            <p className="text-xl text-white">
              Join us to explore how we can collectively build a future that's not just survivable but <span className="italic">f*ing awesome</span>.
            </p>
            <div className="flex mt-4">
              <CTALinkOrButton url={ctaUrl}>Start learning for free</CTALinkOrButton>
            </div>
          </div>
          <div className="w-1/5 hidden md:block">
            <img src="/images/lander/bluedot_logo_cream_thin.png" alt="BlueDot logo" className="w-full" />
          </div>
        </div>
      </Container>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPageBase;
