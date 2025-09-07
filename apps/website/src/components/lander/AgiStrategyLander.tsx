import Head from 'next/head';
import {
  CTALinkOrButton,
  Section,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  QuoteCarousel,
} from '@bluedot/ui';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FaCalendarAlt, FaUserFriends, FaLaptop } from 'react-icons/fa';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { H1, H2, H3 } from '../Text';
import TestimonialSubSection, { Testimonial } from '../homepage/CommunitySection/TestimonialSubSection';
import GraduateSection from '../homepage/GraduateSection';
import MarkdownExtendedRenderer from '../courses/MarkdownExtendedRenderer';
import HeroSection from './agi-strategy/HeroSection';

const AgiStrategyBanner = ({ title, ctaUrl }: { title: string, ctaUrl: string }) => {
  return (
    <div className="agi-strategy-lander__banner relative flex flex-col md:flex-row gap-6 items-center justify-center w-full p-12 text-center bg-bluedot-lighter">
      <H3 className="agi-strategy-lander__banner-title">{title}</H3>
      <div className="flex flex-col sm:flex-row gap-4">
        <CTALinkOrButton className="agi-strategy-lander__banner-cta" url={ctaUrl} withChevron>
          Apply now
        </CTALinkOrButton>
        <CTALinkOrButton className="agi-strategy-lander__banner-cta" url="/courses/agi-strategy/1">
          Browse curriculum
        </CTALinkOrButton>
      </div>
    </div>
  );
};

const applicationUrl = 'https://web.miniextensions.com/9Kuya4AzFGWgayC3gQaX?utm_source=website_lander';

const testimonials1: Testimonial[] = [
  {
    quote: 'Starting to upskill in this field was daunting! The course provided a wonderfully structured curriculum and knowledgable facilitators. Having completed this course, I feel much more confident in my ability and prospects to find my area of most impact in AI safety in the near future!',
    name: 'Sabrina Shih: AI Policy Manager, Responsible AI Institute',
    role: 'AI Alignment Course Graduate',
    imageSrc: '/images/graduates/sabrina.jpg',
  },
  {
    quote: "BlueDot's course allowed me to bridge the gap between my previous career as an economist to now working in the UK Government AI Directorate.",
    name: 'Matthew Bradbury: Senior AI Risk Analyst, UK Government',
    role: 'AI Governance Course Graduate',
    imageSrc: '/images/graduates/matthew.png',
  },
  {
    quote: 'Coming from a public sector responsible AI background and having designed several educational programmes myself, I found the BlueDot course truly humbling and impressive pedagogically. This course is suitable for anyone motivated to work on AI Safety and contribute to the wider discourse in one of the most important topics of our time',
    name: 'Mishka Nemes: Responsible AI & Skills Advisor, Alan Turing Institute',
    role: 'AI Governance Course Graduate',
    imageSrc: '/images/graduates/mishka.jpg',
  },
];

const AgiStrategyLander = () => {
  return (
    <div className="bg-white">
      <Head>
        <title>AGI Strategy Course | BlueDot Impact</title>
        <meta name="description" content="Develop strategic thinking skills for AGI governance and long-term AI strategy. Join our intensive course for strategists shaping the future of artificial general intelligence." />
      </Head>

      <HeroSection
        metadata={{
          duration: '30 hours',
          certification: 'Verified certificate',
          level: 'Beginner-friendly',
        }}
        title="AGI Strategy – Learn how to navigate humanity's most critical decade"
        description="Artificial General Intelligence is moving from research to reality. Understand the race, the risks, and the strategic decisions that will shape economies, security, and our collective future."
        primaryCta={{
          text: 'Apply now',
          url: applicationUrl,
        }}
        secondaryCta={{
          text: 'Browse curriculum',
          url: '/courses/agi-strategy/1',
        }}
        visualComponent={(
          <img
            src="/images/agi-strategy/hero-banner-split.png"
            alt="AGI Strategy visualization"
            className="size-full object-cover"
          />
        )}
      />

      {/* Graduate section */}
      <GraduateSection />

      <Section>
        <div className="prose prose-lg max-w-none">
          <MarkdownExtendedRenderer>
            {`
## What is AGI?

**AI that matches or exceeds human capabilities at everything.**

Not just chatbots. Not just image generation. Systems that can do everything you can do: write, research, strategise, code, innovate. But better, faster, cheaper, and at infinite scale.

**Leading AI researchers believe this is coming within 3-10 years.**

Big Tech companies have it as their mission to build it. The governments regulating it don't understand it. And the decisions being made today determine whether this technology liberates humanity or destabilises it.

**This workshop prepares you to be part of those decisions.**

## Who we are

The team behind **BlueDot Impact** has trained over 5,000 AI safety professionals since 2021, before ChatGPT made AI mainstream. We were founded at the University of Cambridge, working closely with leading AI researchers, engineers and policymakers. 

Our community includes:

- Former AI company researchers who've worked on frontier models
- Government advisors who've shaped national AI strategies
- Entrepreneurs who've built AI safety tools

We're funded by philanthropic grants, not venture capital. Our incentive is impact, not profit.

## Logistics made simple

**How the course works**

- You’ll join a small group of ~8 peers, and you’ll meet with them online to discuss readings and complete learning activities
- Before each live discussion, you’ll do 2-3 hours of reading and writing
- Each discussion lasts 2 hours
- Your discussions are facilitated by an AI safety expert
- Participation is free for everyone, and the course is virtual so anyone on earth can join

**Choose your intensity**

- **Intensive**: 6-day course
    - 1 live discussion each day
    - 5 hours/day total
- **Part-time**: 6-week course
    - 1 live discussion each week
    - 5 hours/week total

**New round every month**

`}
          </MarkdownExtendedRenderer>
        </div>
      </Section>

      <Section className="mt-8">
        {/* Testimonials */}
        <TestimonialSubSection testimonials={testimonials1} title="What people say about us" />
      </Section>

      {/* Banner */}
      <AgiStrategyBanner
        title="Join our AGI Strategy Course and become a leader in shaping humanity's AI future."
        ctaUrl={applicationUrl}
      />

    </div>
  );
};

export default AgiStrategyLander;
