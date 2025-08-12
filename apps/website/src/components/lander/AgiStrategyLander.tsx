import Head from 'next/head';
import {
  CTALinkOrButton,
  Section,
  QuoteCarousel,
} from '@bluedot/ui';
import {
  HeroH1,
  HeroMiniTitle,
  HeroCTAContainer,
  HeroSection,
} from '@bluedot/ui/src/HeroSection';
import { FaCalendarAlt, FaUserFriends, FaLaptop } from 'react-icons/fa';

import { H1, H2, H3 } from '../Text';
import TestimonialSubSection, { Testimonial } from '../homepage/CommunitySection/TestimonialSubSection';
import GraduateSection from '../homepage/GraduateSection';
import MarkdownExtendedRenderer from '../courses/MarkdownExtendedRenderer';

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

const customMiniTitle = 'AGI Strategy Course';
const customTitle = 'Are you a strategist who wants to shape the future of artificial general intelligence?';

const applicationUrl = 'https://web.miniextensions.com/aGd0mXnpcN1gfqlnYNZc';

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
    <>
      <Head>
        <title>AGI Strategy Course | BlueDot Impact</title>
        <meta name="description" content="Develop strategic thinking skills for AGI governance and long-term AI strategy. Join our intensive course for strategists shaping the future of artificial general intelligence." />
      </Head>
      
      <HeroSection>
        <HeroMiniTitle>{customMiniTitle}</HeroMiniTitle>
        <HeroH1 className="agi-strategy-lander__hero-title">{customTitle}</HeroH1>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          <HeroCTAContainer>
            <CTALinkOrButton url={applicationUrl}>Apply now</CTALinkOrButton>
          </HeroCTAContainer>
          <HeroCTAContainer>
            <CTALinkOrButton url="/courses/agi-strategy/1">Browse curriculum</CTALinkOrButton>
          </HeroCTAContainer>
        </div>
      </HeroSection>

      {/* Graduate section */}
      <GraduateSection />

      <Section id="details">
        <div className="prose prose-lg max-w-none">
          <MarkdownExtendedRenderer>
{`## Shape the future of AGI strategy

Are you ready to become a strategic leader in one of humanity's most important transitions? Our AGI Strategy Course prepares strategists, consultants, and policy professionals to navigate the complex landscape of artificial general intelligence.

## What you'll learn

By the end of this intensive course, you'll master:

- **AGI Scenario Planning**: Develop robust frameworks for analyzing potential AGI development pathways and their strategic implications
- **Governance Strategy**: Design governance mechanisms and policy frameworks for managing AGI development and deployment
- **Risk Assessment**: Conduct strategic risk analysis for AGI systems and organizational decision-making
- **Stakeholder Alignment**: Build consensus among diverse stakeholders on AGI governance approaches
- **Strategic Communication**: Communicate complex AGI concepts to executives, policymakers, and the public

## Current opportunities in AGI Strategy

The field is rapidly expanding with high-impact roles opening at:

- **Chief Strategy Officer, Anthropic**: Leading strategic planning for one of the world's leading AI safety companies, focusing on AGI preparedness and governance frameworks
- **Senior Strategy Analyst, DeepMind**: Developing long-term strategic plans for AGI development timelines and safety integration
- **AGI Policy Director, MIRI**: Shaping organizational strategy for AGI alignment research and policy advocacy
- **Strategic Advisor, Center for AI Safety**: Providing strategic guidance on AGI governance and international coordination efforts
- **Principal Consultant, Boston Consulting Group**: Leading AGI strategy engagements for Fortune 500 companies preparing for transformative AI

## Why join the course?

We'll transform you into a world-class AGI strategist, preparing you for the most critical strategic challenges of the 21st century.

You'll commit to 8 hours of intensive strategic training over two weeks:
- 6 hours of expert-led workshops and scenario planning exercises
- 2 hours of peer collaboration and strategic case study analysis
- Flexible scheduling around your professional commitments

## Who is this course for?

This course is designed for mid-to-senior-level strategic professionals who want to specialize in AGI governance.

You'd be a great fit if:
- **You have 3-7 years of strategic experience** – You've worked in strategy consulting, policy analysis, or organizational strategy roles
  - Bonus: experience with emerging technology strategy, government relations, or multi-stakeholder initiatives
  - Bonus: you can describe a complex strategic challenge you've successfully navigated
- **You think systematically** – You excel at breaking down complex problems and developing comprehensive strategic frameworks
- **You're ready for global impact** – You're motivated to work on strategies that could affect humanity's long-term future

This is NOT for you if:
- You're seeking technical AI research or engineering positions
- You prefer tactical execution over strategic planning

## Why are we doing this?

We believe that the transition to AGI will be one of the most consequential strategic challenges in human history. Success requires exceptional strategic minds working on governance, coordination, and long-term planning.

Our graduates now shape AGI strategy at leading AI companies, government agencies, and international organizations. We're expanding our impact by training the next generation of AGI strategists.

## More details

Questions about the program? Contact [strategy@bluedot.org](mailto:strategy@bluedot.org) and we'll get back to you within 24 hours.`}
          </MarkdownExtendedRenderer>
        </div>
      </Section>

      <Section className="mt-8">
        {/* Testimonials */}
        <TestimonialSubSection testimonials={testimonials1} title="What people say about our other courses" />
      </Section>

      {/* Banner */}
      <AgiStrategyBanner 
        title="Join our AGI Strategy Course and become a leader in shaping humanity's AI future." 
        ctaUrl={applicationUrl} 
      />

    </>
  );
};

export default AgiStrategyLander;
