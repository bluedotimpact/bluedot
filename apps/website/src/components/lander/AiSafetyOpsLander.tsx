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
import MarkdownExtendedRenderer from '../courses/MarkdownExtendedRenderer';

const AiSafetyOpsBanner = ({ title, ctaUrl }: { title: string, ctaUrl: string }) => {
  return (
    <div className="ai-safety-ops-lander__banner relative flex flex-col md:flex-row gap-6 items-center justify-center w-full p-12 text-center bg-bluedot-lighter">
      <H3 className="ai-safety-ops-lander__banner-title">{title}</H3>
      <CTALinkOrButton className="ai-safety-ops-lander__banner-cta" url={ctaUrl} withChevron>
        Apply now
      </CTALinkOrButton>
    </div>
  );
};

const customMiniTitle = 'AI Safety Operations Bootcamp';
const customTitle = 'Are you an operations specialist who wants to make the future go well?';

const applicationUrl = 'https://forms.bluedot.org/1W29W7atNVeEF3RTkfCX';

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

const testimonials2 = [
  {
    quote: 'Entering the course from a non-technical background, I wasn’t sure what to expect or if I would be able to keep up with the material. It turned out to be the perfect level of challenging yet achievable for me. I learned so much from the readings, insightful conversations and activities during the sessions in particular. I always felt supported and welcome to contribute, and the diversity of knowledge in that virtual room helped all of us to learn and consider new perspectives. I thoroughly enjoyed the course and it became something I really looked forward to every Friday!',
    name: 'Belle Yeung',
    role: 'Head of AI Governance, Arcadia Impact',
    imageSrc: '/images/graduates/belle.jpg',
  },
  {
    quote: 'The course was a game-changer for me. It allowed me not only to gain invaluable knowledge but also to connect with like-minded individuals, engaging in thought-provoking discussions that expanded my understanding. This course played a crucial role in supporting my successful application to the MATS Program, where I\'m now working on AI safety research. It\'s also a testament to the course\'s quality that one of my course group members is now at MATS with me!',
    name: 'Constantin Weisser',
    role: 'Founding Engineer, Haize Labs',
    imageSrc: '/images/graduates/constantin.jpg',
  },
  {
    quote: 'This course is the perfect starting point for anyone interested in AI Safety. The team excels at curating relevant resources, and the curriculum is always accessible for future reference. The community is very active, providing support, interesting research directions, and collaboration opportunities. I left feeling much more confident in my AI Safety and Ethics career, with a strong community of like-minded professionals. I highly recommend this course to anyone looking to make an impact in AI Safety!',
    name: 'Su Cizem',
    role: 'AI Governance Analyst, CeSIA',
    imageSrc: '/images/graduates/su.jpg',
  },
];

const AiSafetyOpsLander = () => {
  return (
    <>
      <Head>
        <title>AI Safety Operations Bootcamp | BlueDot Impact</title>
        <meta name="description" content="This intensive bootcamp prepares early-to-mid-career working professionals for operational roles in AI safety." />
        <meta property="og:title" content="AI Safety Operations Bootcamp | BlueDot Impact" />
        <meta property="og:description" content="This intensive bootcamp prepares early-to-mid-career working professionals for operational roles in AI safety." />
        <meta property="og:image" content="https://bluedot.org/images/courses/ops-bootcamp-og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="AI Safety Operations Bootcamp | BlueDot Impact" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="BlueDot Impact" />
        <meta property="og:url" content="https://bluedot.org/courses/ops" />
      </Head>

      {/* Mobile hero */}
      <HeroSection className="2xl:hidden">
        <HeroMiniTitle>{customMiniTitle}</HeroMiniTitle>
        <HeroH1>{customTitle}</HeroH1>
        <div className="flex flex-row flex-wrap justify-center gap-2 items-center mt-4">
          <div className="flex gap-2 items-center border border-color-border rounded-lg p-4 text-color-text-on-dark">
            <FaCalendarAlt /> 6 hours total
          </div>
          <div className="flex gap-2 items-center border border-color-border rounded-lg p-4 text-color-text-on-dark">
            <FaUserFriends /> Group discussions
          </div>
          <div className="flex gap-2 items-center border border-color-border rounded-lg p-4 text-color-text-on-dark">
            <FaLaptop /> Online
          </div>
        </div>
        <HeroCTAContainer>
          <CTALinkOrButton url={applicationUrl} withChevron>Apply now</CTALinkOrButton>
        </HeroCTAContainer>
      </HeroSection>

      {/* Desktop hero */}
      <div className="hidden 2xl:flex flex-row justify-center items-center w-full py-12 px-spacing-x bg-color-canvas relative min-h-160">
        <div className="ai-safety-ops-lander__hero-container flex flex-row justify-between items-center w-max-width px-spacing-x">
          <div className="
              ai-safety-ops-lander__hero-content flex flex-col items-start w-1/2 max-w-[555px] z-10
              after:content-[''] after:-z-10 after:absolute after:bg-bluedot-darker after:size-full after:top-0 after:right-[45%] after:-skew-x-[10deg]"
          >
            <H1 className="text-color-text-on-dark uppercase tracking-wider text-size-sm font-semibold mb-4">{customMiniTitle}</H1>
            <H2 className="text-color-text-on-dark">{customTitle}</H2>
            <div className="flex flex-row flex-wrap justify-start gap-2 items-center mt-8">
              <div className="flex gap-2 items-center border border-color-border rounded-lg p-4 text-color-text-on-dark">
                <FaCalendarAlt /> 6 hours total
              </div>
              <div className="flex gap-2 items-center border border-color-border rounded-lg p-4 text-color-text-on-dark">
                <FaUserFriends /> Group discussions
              </div>
              <div className="flex gap-2 items-center border border-color-border rounded-lg p-4 text-color-text-on-dark">
                <FaLaptop /> Online
              </div>
            </div>
            <HeroCTAContainer>
              <CTALinkOrButton url={applicationUrl} withChevron>Apply now</CTALinkOrButton>
            </HeroCTAContainer>
          </div>
          <QuoteCarousel className="ai-safety-ops-lander__hero-quotes text-color-text w-1/2 max-w-[555px] z-10 pl-12" quotes={testimonials1} />
        </div>
      </div>

      {/* Role details section */}
      <Section>
        <div className="ai-safety-ops-lander__details-section w-full flex flex-col justify-center gap-12 items-center mt-4 mx-auto max-w-3xl">
          <MarkdownExtendedRenderer>
            {`## What roles does this bootcamp prepare you for?

This bootcamp prepares you for early-to-mid-career **operations roles in AI safety**.

Crucial AI safety research depends on many operational tasks: recruiting study participants, getting access to the right datasets, negotiating contracts with AI companies, and about 100 other things.

Example roles:
- **Delivery Adviser, Human Influence, AISI**: This team investigates how AI systems can manipulate, persuade, deceive or subtly steer human behaviours, for example by running large-scale human studies to measure these impacts ([more details](https://www.civilservicejobs.service.gov.uk/csr/jobs.cgi?jcode=1952892)).
- **Delivery Adviser, Cyber and Autonomous Systems, AISI**: This team maps dangerous AI capabilities that could threaten cybersecurity and human control over autonomous systems, for example developing evaluations for whether AI systems can copy themselves across systems ([more details](https://www.civilservicejobs.service.gov.uk/csr/jobs.cgi?jcode=1952889))
- **Delivery Adviser, Societal Resilience, AISI**: This team studies how AI capabilities might be used for harm, and interventions we can put in place to protect the world - for example, collaborating with the above teams to safeguard democratic institutions or AI-proofing critical national infrastructure from cyberattacks ([more details](https://www.civilservicejobs.service.gov.uk/csr/jobs.cgi?jcode=1952892))
- **Operations Strategist, CLTR**: This Westminster-based think tank focuses on global resilience research, advising the UK government on biosecurity and AI risks while building policy frameworks for long-term societal challenges ([more details](https://www.longtermresilience.org/the-centre-for-long-term-resilience-is-recruiting-a-policy-and-operations-strategist/))
- **Executive Operations Manager, Palisade**: This AI safety nonprofit studies offensive AI capabilities, demonstrating how models can hack benchmarks, strip safety guardrails, conduct autonomous cyber attacks, and create sophisticated deception tools like automated deepfake voice generation ([more details](https://global.palisaderesearch.org/hiring-senior-pa))

## Why join the bootcamp?

We’ll make you exceptional at AI safety operations, preparing you for a market that's heating up for these skills.

By the end of this bootcamp, you’ll be able to:
- Talk confidently about core AI and AI safety concepts
- Explain the role key organisations play in global AI security
- Leverage AI and other tools effectively to become a top-tier contributor
- Apply your new understanding and skills to practical operations challenges
- Evaluate your fit for these and other similar operations roles

You’ll commit to 6 hours of upskilling next week, which can be done alongside a full-time job:
- 4 hours independent study
- 2x 1-hour group discussions, over your lunch break (12:30-1:30pm UK time) or after work (7pm-8pm UK time)

## Who is this bootcamp for?

This bootcamp is ideal for early-to-mid-career professionals **who get shit done**. You don't need AI or AI safety experience.

You'd be a great fit if:
- **You have 2-5 years of relevant experience** – You've worked in operational and/or project delivery roles
  - Bonus: experience working in startup or R&D environments, technical project management, contract management, stakeholder engagement
  - Bonus: you can describe an impressive operations success, where you've run through walls to make things happen
- **You move fast** – You hit the ground running and have experience managing complex projects under rapid timelines
- **You can work in London** – You're willing to work from London, and have right to work in the UK

This is NOT for you if:
- You're seeking a policy, strategy or technical AI research position

## Why are we doing this?

We’re a non-profit education organisation building the workforce that protects humanity. We think safely navigating the transition to transformative AI might be one of the biggest challenges humanity has ever faced, and we’ll need excellent people in key roles to make this happen.

We train excellent people to fill these important roles - so far we’ve trained thousands of people who now work at organisations such as AISI, Anthropic, the UN and NATO.

Having reviewed the open jobs across AI safety organisations in May 2025, and spoken to hiring managers, we think that operations roles are important and neglected. This means if you are an awesome operator (or have the capacity to be after our training), we’re keen to help you.

## More details

Got questions or feedback? We’d love to hear from you - email [adam@bluedot.org](mailto:adam@bluedot.org) and we’ll try to get back to you ASAP.`}
          </MarkdownExtendedRenderer>
        </div>
      </Section>

      {/* Banner */}
      <AiSafetyOpsBanner title="Join our AI Safety Operations Bootcamp and accelerate your impact in AI safety." ctaUrl={applicationUrl} />

      <Section className="mt-8">
        {/* Testimonials mobile */}
        <div className="xl:hidden">
          <TestimonialSubSection testimonials={[...testimonials1, ...testimonials2]} title="What people say about our other courses" />
        </div>

        {/* Testimonials desktop */}
        <div className="hidden xl:block">
          <TestimonialSubSection testimonials={testimonials2} title="What people say about our other courses" />
        </div>
      </Section>
    </>
  );
};

export default AiSafetyOpsLander;
