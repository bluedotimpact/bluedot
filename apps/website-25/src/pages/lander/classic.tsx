import {
  HeroH1,
  HeroH2,
  HeroSection,
  HeroCTAContainer,
  CTALinkOrButton,
  Footer,
} from '@bluedot/ui';
import Head from 'next/head';
import React from 'react';
import { CTAProps } from '@bluedot/ui/src/CTALinkOrButton';
import {
  FaStar,
  FaStopwatch,
  FaAward,
} from 'react-icons/fa6';
import clsx from 'clsx';
import GraduateSection from '../../components/homepage/GraduateSection';
import { ROUTES } from '../../lib/routes';

const Container: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => {
  return <section className={clsx('max-w-5xl mx-auto px-4 sm:px-8', className)}>{children}</section>;
};

const NewNav: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <nav className="w-full bg-cream-normal sticky top-0 border-b-2 border-color-divider">
      <Container className="h-16 flex items-center justify-between">
        <a href="/">
          <img src="/images/logo/BlueDot_Impact_Logo.svg" alt="BlueDot Impact" className="h-4 sm:h-8" />
        </a>
        <div className="flex gap-8 items-center">
          {children}
        </div>
      </Container>
    </nav>
  );
};

const NewNavItem: React.FC<React.PropsWithChildren<{ href: string }>> = ({ children, href }) => <a href={href}>{children}</a>;
const NewNavButton: React.FC<CTAProps> = (props) => <CTALinkOrButton {...props} />;

const LandingPage = (): JSX.Element => {
  return (
    <div className="min-h-screen bg-cream-normal">
      <Head>
        <title>BlueDot Impact | Future-proof your career</title>
        <meta name="description" content="No jargon, no coding, no pre-requisites – just bring your curiosity for how AI will reshape your world." />
      </Head>
      <NewNav>
        <NewNavItem href="https://course.bluedot.org/login">Login</NewNavItem>
        <NewNavButton url="https://course.bluedot.org/login">Start learning</NewNavButton>
      </NewNav>
      <HeroSection className="-mt-20 text-white bg-[url('/images/logo/logo_hero_background.svg')] bg-cover">
        <HeroH1 className="font-serif text-5xl sm:text-7xl font-normal">Future-proof your career</HeroH1>
        <HeroH2 className="text-size-md sm:text-size-lg font-light max-w-2xl mx-auto mt-10">No jargon, no coding, no pre-requisites – just bring your curiosity for how AI will reshape your world.</HeroH2>
        <HeroCTAContainer>
          <CTALinkOrButton>Start learning for free</CTALinkOrButton>
        </HeroCTAContainer>
        <div className="flex flex-wrap justify-center gap-6 sm:gap-20 mt-10 uppercase font-bold">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
            <FaStar className="text-2xl" />
            <span>4.7/5 rating</span>
          </div>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
            <FaStopwatch className="text-2xl" />
            <span>2 hours</span>
          </div>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
            <FaAward className="text-2xl" />
            <span>Get certified</span>
          </div>
        </div>
      </HeroSection>
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

      <div className="bg-bluedot-lighter">
        <Container className="py-16">
          <div className="flex items-start gap-4 md:gap-8">
            <img src="/images/graduates/matthew.png" alt="" className="size-24 md:size-50 rounded-full object-cover shrink-0" />
            <div>
              {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
              <p className="font-serif text-size-lg md:text-3xl mb-3 md:mr-20">
                “This is a nice testimonial from someone who said the course is cool and good”
              </p>
              <p className="font-serif text-size-sm md:text-size-md text-gray-800 md:mr-20">~Their Name, Cool Job Title at Organization</p>
              {/* The mr-50 here is to allow centering the CTA button, compared to the size-50 profile pic on the left */}
              <div className="hidden md:flex justify-center mr-50">
                <CTALinkOrButton url="https://course.bluedot.org/login" className="mt-7">
                  Start learning with 4000+ others
                </CTALinkOrButton>
              </div>
            </div>
          </div>
          <div className="md:hidden flex justify-center">
            <CTALinkOrButton url="https://course.bluedot.org/login" className="mt-7">
              Start learning with 40000+ others
            </CTALinkOrButton>
          </div>
        </Container>
      </div>

      {/* Why Take the Course Section */}
      <Container className="py-16">
        {/* TODO: add reckless neue bold */}
        <h2 className="text-size-xl font-serif font-bold text-center mb-12 text-bluedot-dark">Why take the course?</h2>
        <div className="grid md:grid-cols-3 gap-16">
          <div className="text-center">
            <div className="size-32 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <img src="/images/lander/icon_interact.svg" alt="" className="size-16" />
            </div>
            <h3 className="font-semibold mb-2">Try the latest AI tools</h3>
            <p className="text-gray-600 text-size-md mx-4">Learn how today’s AI actually works</p>
          </div>
          <div className="text-center">
            <div className="size-32 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <img src="/images/lander/icon_book.svg" alt="" className="size-20" />
            </div>
            <h3 className="font-semibold mb-2">Go beyond headlines</h3>
            <p className="text-gray-600 text-size-md mx-4">Understand the future trajectory of AI</p>
          </div>
          <div className="text-center">
            <div className="size-32 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <img src="/images/lander/icon_globe.svg" alt="" className="size-18" />
            </div>
            <h3 className="font-semibold mb-2">Shape AI's development</h3>
            <p className="text-gray-600 text-size-md mx-4">Use your skills and voice for good</p>
          </div>
        </div>
      </Container>

      {/* Course Units Section */}
      <div className="bg-bluedot-lighter">
        <Container className="py-16">
          {/* TODO: add reckless neue bold */}
          <h2 className="text-size-xl font-serif font-bold text-center mb-12 text-bluedot-dark">What's covered?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
            <div className="p-6 bg-cream-normal rounded-lg">
              <p className="uppercase font-semibold text-gray-600">Unit 1</p>
              <h3 className="text-size-lg font-semibold my-2">Beyond chatbots: the expanding frontier of AI capabilities</h3>
              <p className="text-gray-600">
                AI is evolving from helpful ‘tools’ into capable autonomous ‘agents’ capable of independently setting goals, making decisions, and acting on them.
              </p>
            </div>
            {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
            <div className="p-6 bg-cream-normal rounded-lg">
              <p className="uppercase font-semibold text-gray-600">Unit 2</p>
              <h3 className="text-size-lg font-semibold my-2">Artificial general intelligence: on the horizon?</h3>
              <p className="text-gray-600">
                Examining what capabilities an AI system would need to match human performance and how close current technology is to achieving this milestone.
              </p>
            </div>

            {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
            <div className="p-6 bg-cream-normal rounded-lg">
              <p className="uppercase font-semibold text-gray-600">Unit 3</p>
              <h3 className="text-size-lg font-semibold my-2">AGI will drastically change how we live</h3>
              <p className="text-gray-600">
                Exploring how AGI could transform society like previous revolutionary technologies, with potentially more profound implications for humanity.
              </p>
            </div>

            {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
            <div className="p-6 bg-cream-normal rounded-lg">
              <p className="uppercase font-semibold text-gray-600">Unit 4</p>
              <h3 className="text-size-lg font-semibold my-2">What can be done?</h3>
              <p className="text-gray-600">
                Navigating the critical balance between realizing AI's enormous benefits while avoiding potential large-scale harms and maintaining human control.
              </p>
            </div>
          </div>
          <div className="flex justify-center mt-8">
            <CTALinkOrButton url="https://course.bluedot.org/login">Start learning from unit 1 today</CTALinkOrButton>
          </div>
        </Container>
      </div>

      {/* You're in Good Hands Section */}
      <Container className="py-16">
        {/* TODO: add reckless neue bold */}
        <h2 className="text-size-xl font-serif font-bold text-left mb-8 text-bluedot-dark">You're in good hands</h2>
        <div className="w-3/4">
          <p className="mb-4 text-size-md">
            We started BlueDot to help others understand and work on challenges from emerging technologies.
          </p>
          <p className="mb-8 text-size-md">
            Since 2021, we’ve designed our courses with some of the world’s leading experts and helped thousands of talented people build the skills to make a real difference.
          </p>
          <CTALinkOrButton variant="secondary" url={ROUTES.about.url}>Read about us</CTALinkOrButton>
        </div>
        <div className="flex justify-end -mt-16">
          <img src="/images/lander/signed_dewi_and_will.svg" alt="Dewi and Will, BlueDot Co-Founders" className="w-2/3" />
        </div>
      </Container>

      {/* Course Units Section */}
      <div className="bg-bluedot-lighter">
        <Container className="py-16">
          {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
          <h2 className="text-3xl font-light font-serif text-center">AI will reshape every aspect of society - from jobs and education to science and healthcare. <span className="text-bluedot-normal">We all need to understand what's ahead.</span></h2>
          <div className="flex justify-center mt-4">
            <CTALinkOrButton url="https://course.bluedot.org/login">Start learning for free</CTALinkOrButton>
          </div>
        </Container>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

LandingPage.rawLayout = true;

export default LandingPage;
