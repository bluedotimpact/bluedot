import {
  CTALinkOrButton,
  Footer,
} from '@bluedot/ui';
import Head from 'next/head';
import { ROUTES } from '../../lib/routes';
import Container from './Container';
import NewNav from './NewNav';
import SingleTestimonial from './SingleTestimonial';
import Features from './Features';
import CourseUnits from './CourseUnits';
import BlueH2 from './BlueH2';
import { getCtaUrl } from './getCtaUrl';
import GraduateSection from '../homepage/GraduateSection';

export interface LandingPageBaseProps {
  /** Hero component to render */
  hero: React.ReactNode;
  /** Variant name, used for analytics */
  variant: string;
}

const LandingPageBase = ({ hero, variant }: LandingPageBaseProps) => {
  const ctaUrl = getCtaUrl(variant);

  return (
    <div className="min-h-screen bg-cream-normal">
      <Head>
        <title>BlueDot Impact | Future-proof your career</title>
        <meta name="description" content="No jargon, no coding, no pre-requisites – just bring your curiosity for how AI will reshape your world." />
      </Head>
      <NewNav>
        <NewNav.Item url="https://course.bluedot.org/login">Login</NewNav.Item>
        <NewNav.Button url={ctaUrl}>Sign up for free</NewNav.Button>
      </NewNav>
      {hero}

      <Container>
        <GraduateSection />
      </Container>

      <Container className="py-16">
        <BlueH2>The vision</BlueH2>
        <Features>
          <Features.Feature iconSrc="/images/lander/icon_hands.svg" iconClassName="size-24">
            <Features.Title>Do things you love</Features.Title>
            <Features.Subtitle>Transform work from necessity to choice</Features.Subtitle>
          </Features.Feature>
          <Features.Feature iconSrc="/images/lander/icon_washing_machine.svg">
            <Features.Title>Beyond the grind</Features.Title>
            <Features.Subtitle>No more emails and laundry</Features.Subtitle>
          </Features.Feature>
          <Features.Feature iconSrc="/images/lander/icon_time.svg">
            <Features.Title>Reclaim your time</Features.Title>
            <Features.Subtitle>Take back 40 hours each week</Features.Subtitle>
          </Features.Feature>
        </Features>
      </Container>

      <Container bgClassname="bg-bluedot-lighter" className="py-16">
        <SingleTestimonial imgSrc="/images/graduates/crystal.jpeg">
          <SingleTestimonial.Quote>
            It didn't just teach me about AI safety; it clarified my purpose.
          </SingleTestimonial.Quote>
          <SingleTestimonial.Attribution>
            ~Crystal Isanda, Foresight Fellow @ Unicef
          </SingleTestimonial.Attribution>
          <SingleTestimonial.CTA url={ctaUrl}>
            Start learning with 4000+ others
          </SingleTestimonial.CTA>
        </SingleTestimonial>
      </Container>

      <Container className="grid md:flex gap-6 md:gap-12 items-center py-10">
        <div>
          {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
          <h2 className="text-3xl font-serif font-bold">Our reality</h2>
          <p className="text-size-md mt-4">Millions spend their days doing tasks they'd rather not, in jobs that drain rather than fulfil them, serving economic structures that benefit few at the expense of many.</p>
          {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
          <h2 className="text-3xl font-serif font-bold mt-10">The opportunity</h2>
          <p className="text-size-md mt-4">Now, AI is about to automate most human jobs — creating an unprecedented opportunity to <span className="italic">make work optional</span>. This technological revolution could free humanity from drudgery while addressing our greatest challenges — but only if we get the transition right.</p>
        </div>
        <div className="mx-auto w-3/4 md:w-100 shrink-0">
          <img src="/images/lander/future_world_polaroids.png" alt="" className="w-full" />
        </div>
      </Container>

      {/* Course Units Section */}
      <Container bgClassname="bg-bluedot-lighter" className="py-16">
        <BlueH2>What's covered?</BlueH2>
        <CourseUnits>
          <CourseUnits.Unit unitNumber="1">
            <CourseUnits.Title>AI Agents & What They Can Do</CourseUnits.Title>
            <CourseUnits.Description>See how smart AI assistants are making work-optional futures possible for the first time and how they're already changing everyday tasks.</CourseUnits.Description>
          </CourseUnits.Unit>
          <CourseUnits.Unit unitNumber="2">
            <CourseUnits.Title>Getting Your Time Back</CourseUnits.Title>
            <CourseUnits.Description>Try practical AI tools that can save you 10+ hours every week by handling your most boring tasks, freeing you to do what really matters.</CourseUnits.Description>
          </CourseUnits.Unit>
          <CourseUnits.Unit unitNumber="3">
            <CourseUnits.Title>Two Possible Futures</CourseUnits.Title>
            <CourseUnits.Description>Learn about the key choices that will decide whether technology makes life better for everyone or just benefits a few powerful groups.</CourseUnits.Description>
          </CourseUnits.Unit>
          <CourseUnits.Unit unitNumber="4">
            <CourseUnits.Title>Be Part of the Change</CourseUnits.Title>
            <CourseUnits.Description>Discover how you can help shape these technologies in your community and workplace, and join others working toward a better future.</CourseUnits.Description>
          </CourseUnits.Unit>
        </CourseUnits>
        <div className="flex justify-center mt-8">
          <CTALinkOrButton url={ctaUrl}>Sign up for free</CTALinkOrButton>
        </div>
      </Container>

      <Container className="py-16">
        <BlueH2 className="!text-left !mb-4 md:!mb-6">You're in good hands</BlueH2>
        <div className="w-3/4">
          <p className="mb-4 text-size-md">
            We started BlueDot to help others understand and work on challenges from emerging technologies.
          </p>
          <p className="mb-8 text-size-md">
            Since 2021, we've designed our courses with some of the world's leading experts and helped thousands of talented people build the skills to make a real difference.
          </p>
          <CTALinkOrButton variant="secondary" url={ROUTES.about.url}>Read about us</CTALinkOrButton>
        </div>
        <div className="flex justify-end -mt-8 sm:-mt-16 pointer-events-none">
          <img src="/images/lander/signed_dewi_and_will.svg" alt="Dewi and Will, BlueDot Co-Founders" className="sm:w-2/3" />
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
