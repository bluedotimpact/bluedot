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

      <Container className="py-16">
        <BlueHeader>The vision</BlueHeader>
        <FeaturesSection>
          <Feature iconSrc="/images/lander/icon_hands.svg" iconClassName="size-24">
            <FeatureTitle>Do things you love</FeatureTitle>
            <FeatureSubtitle>Transform work from necessity to choice</FeatureSubtitle>
          </Feature>
          <Feature iconSrc="/images/lander/icon_washing_machine.svg">
            <FeatureTitle>Beyond the grind</FeatureTitle>
            <FeatureSubtitle>No more emails and laundry</FeatureSubtitle>
          </Feature>
          <Feature iconSrc="/images/lander/icon_time.svg">
            <FeatureTitle>Reclaim your time</FeatureTitle>
            <FeatureSubtitle>Take back 40 hours each week</FeatureSubtitle>
          </Feature>
        </FeaturesSection>
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

      <Container className="grid md:flex gap-6 md:gap-12 items-center py-10">
        <div>
          {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
          <h2 className="text-3xl font-serif font-bold">our reality</h2>
          <p className="text-size-md mt-4">Millions spend their days doing tasks they'd rather not, in jobs that drain rather than fulfil them, serving economic structures that benefit few at the expense of many.</p>
          {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
          <h2 className="text-3xl font-serif font-bold mt-10">the opportunity</h2>
          <p className="text-size-md mt-4">Now, AI is about to automate most human jobs — creating an unprecedented opportunity to <span className="italic">make work optional</span>. This technological revolution could free humanity from drudgery while addressing our greatest challenges — but only if we get the transition right.</p>
        </div>
        <div className="mx-auto w-3/4 md:w-100 shrink-0">
          <img src="/images/lander/future_world_polaroids.png" alt="" className="w-full" />
        </div>
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
