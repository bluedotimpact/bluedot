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
        <NewNavButton url={ctaUrl}>Start learning</NewNavButton>
      </NewNav>
      {hero}

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
        <SingleTestimonialSection imgSrc="/images/graduates/matthew.png">
          <TestimonialQuote>
            This is a nice testimonial from someone who said the course is cool and good
          </TestimonialQuote>
          <TestimonialAttribution>
            ~Their Name, Cool Job Title at Organization
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
            <CourseUnitTitle>Beyond chatbots: the expanding frontier of AI capabilities</CourseUnitTitle>
            <CourseUnitDescription>AI is evolving from helpful 'tools' into capable autonomous 'agents' capable of independently setting goals, making decisions, and acting on them.</CourseUnitDescription>
          </CourseUnit>
          <CourseUnit unitNumber="2">
            <CourseUnitTitle>Artificial general intelligence: on the horizon?</CourseUnitTitle>
            <CourseUnitDescription>Examining what capabilities an AI system would need to match human performance and how close current technology is to achieving this milestone.</CourseUnitDescription>
          </CourseUnit>
          <CourseUnit unitNumber="3">
            <CourseUnitTitle>AGI will drastically change how we live</CourseUnitTitle>
            <CourseUnitDescription>Exploring how AGI could transform society like previous revolutionary technologies, with potentially more profound implications for humanity.</CourseUnitDescription>
          </CourseUnit>
          <CourseUnit unitNumber="4">
            <CourseUnitTitle>What can be done?</CourseUnitTitle>
            <CourseUnitDescription>Navigating the critical balance between realizing AI's enormous benefits while avoiding potential large-scale harms and maintaining human control.</CourseUnitDescription>
          </CourseUnit>
        </CourseUnitsSection>
        <div className="flex justify-center mt-8">
          <CTALinkOrButton url={ctaUrl}>Start learning from unit 1 today</CTALinkOrButton>
        </div>
      </Container>

      <Container className="py-16">
        <BlueHeader className="!text-left">You're in good hands</BlueHeader>
        <div className="w-3/4">
          <p className="mb-4 text-size-md">
            We started BlueDot to help others understand and work on challenges from emerging technologies.
          </p>
          <p className="mb-8 text-size-md">
            Since 2021, we’ve designed our courses with some of the world’s leading experts and helped thousands of talented people build the skills to make a real difference.
          </p>
          <CTALinkOrButton variant="secondary" url={ROUTES.about.url}>Read about us</CTALinkOrButton>
        </div>
        <div className="flex justify-end -mt-16 pointer-events-none">
          <img src="/images/lander/signed_dewi_and_will.svg" alt="Dewi and Will, BlueDot Co-Founders" className="w-2/3" />
        </div>
      </Container>

      <Container bgClassname="bg-bluedot-lighter" className="py-16">
        {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
        <h2 className="text-3xl font-light font-serif text-center ">
          AI will reshape every aspect of society - from jobs and education to science and healthcare. <span className="text-bluedot-normal">We all need to understand what's ahead.</span>
        </h2>
        <div className="flex justify-center mt-4">
          <CTALinkOrButton url={ctaUrl}>Start learning for free</CTALinkOrButton>
        </div>
      </Container>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPageBase;
