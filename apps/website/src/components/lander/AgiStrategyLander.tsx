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
import AgiStrategyTestimonialSubSection, { Testimonial } from './agi-strategy/TestimonialSubSection';
import GraduateSection from './agi-strategy/GraduateSection';
import MarkdownExtendedRenderer from '../courses/MarkdownExtendedRenderer';
import HeroSection from './agi-strategy/HeroSection';

const AgiStrategyBanner = ({ title, ctaUrl }: { title: string, ctaUrl: string }) => {
  return (
    <div className="agi-strategy-lander__banner flex flex-col items-center justify-center w-full py-16 px-12 gap-8 text-center bg-gradient-to-b from-white to-[#ECF0FF] -mt-px">
      <H3 className="agi-strategy-lander__banner-title max-w-[480px] font-semibold text-size-lg leading-tight text-[#13132E]">
        {title}
      </H3>
      <CTALinkOrButton
        size="small"
        className="agi-strategy-lander__banner-cta w-auto h-11 px-5 py-3 text-[14px] font-medium rounded-md bg-[#2244BB] text-white hover:bg-[#1a3399] focus:bg-[#1a3399] transition-colors duration-200 lg:h-[3.125rem] lg:text-[16px]"
        url={ctaUrl}
      >
        Apply now
      </CTALinkOrButton>
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
        title="Start building the defences that protect humanity"
        description="Envision a good future. Map the threats from AI. Design effective interventions. Get funded to start shipping. All in 30 hours."
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

      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />

      {/* Graduate section */}
      <GraduateSection />

      {/* Divider */}
      <div className="border-t-hairline border-color-divider" />

      <Section className="!border-b-0">
        <div className="prose prose-lg max-w-none">
          <MarkdownExtendedRenderer>
            {`

### Take action in less than 30 hours

You don’t need another degree. This course replaces years of self-study with three frameworks: incentive mapping to understand the AGI race, kill chains to analyse AI threats, and defence-in-depth to design interventions that counter them. You’ll finish with a fundable plan.

### Join a network of builders

This course isn’t for everyone. We’re building a community of people who are energised to take ambitious actions to make AI go well, including starting new companies, policy entrepreneurship, and high-impact research bets. Completing this course will give you access to this community.

### Get funded to accelerate your impact

If your final course proposal is strong, you’ll receive $10-50k to kickstart your transition into impactful work, and you’ll be invited to co-work with us in London for 1-2 weeks. We’ll do whatever it takes to accelerate your journey.

## How the course works

**Choose your intensity**

- **Intensive**: 6-day course (5h/day)
- **Part-time**: 6-week course (5h/week)

**Format**

- Before each live 2-hour online discussion, you'll complete 2-3 hours of reading and writing
- You'll meet with a group of ~8 peers to discuss and debate the content
- Your discussions are facilitated by an AI safety expert
- Participation is free for everyone

The next round starts on 29 September. **Application deadline 21 September**.

**New round every month.**

## Who is BlueDot Impact

We’re a London-based startup. Since 2022, we’ve trained 5,000 people, with ~1,000 now working on making AI go well.

Our courses are the main entry point into the AI safety field.

We’ve raised $35M in total, including $25M in 2025.

`}
          </MarkdownExtendedRenderer>
        </div>
      </Section>

      {/* Divider */}
      <div className="border-t-[0.5px] border-color-divider" />

      {/* Testimonials Section */}
      <Section className="py-16">
        <H2 className="text-[36px] text-center font-semibold leading-tight mb-16">Members of our community</H2>
        <AgiStrategyTestimonialSubSection testimonials={testimonials1} />
      </Section>

      {/* Banner */}
      <AgiStrategyBanner
        title="Don’t wait until the world’s even more crazy. Start making an impact today."
        ctaUrl={applicationUrl}
      />

    </div>
  );
};

export default AgiStrategyLander;
