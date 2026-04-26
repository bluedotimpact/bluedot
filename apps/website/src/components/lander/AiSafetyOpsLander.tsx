import Head from 'next/head';
import {
  CTALinkOrButton,
  H3,
  Section,
} from '@bluedot/ui';
import { FaCalendarAlt, FaUserFriends, FaLaptop } from 'react-icons/fa';
import TestimonialSubSection, { type Testimonial } from '../homepage/CommunitySection/TestimonialSubSection';
import MarkdownExtendedRenderer from '../courses/MarkdownExtendedRenderer';
import MarketingHero from '../MarketingHero';
import { trpc } from '../../utils/trpc';

const AiSafetyOpsBanner = ({ title, ctaUrl }: { title: string; ctaUrl: string }) => {
  return (
    <div className="ai-safety-ops-lander__banner relative flex flex-col md:flex-row gap-6 items-center justify-center w-full p-12 text-center bg-bluedot-lighter">
      <H3 className="ai-safety-ops-lander__banner-title">{title}</H3>
      <CTALinkOrButton className="ai-safety-ops-lander__banner-cta" url={ctaUrl} withChevron>
        Apply now
      </CTALinkOrButton>
    </div>
  );
};

const PAGE_TITLE = 'AI Safety Operations Bootcamp';
const PAGE_TAGLINE = 'Are you an operations specialist who wants to make the future go well?';
const applicationUrl = 'https://forms.bluedot.org/1W29W7atNVeEF3RTkfCX';

const AiSafetyOpsLander = () => {
  const { data: dbTestimonials } = trpc.testimonials.getCommunityMembers.useQuery();

  const allTestimonials = dbTestimonials?.map((t): Testimonial => ({ ...t, role: t.jobTitle })) ?? [];

  return (
    <>
      <Head>
        <title>{`${PAGE_TITLE} | BlueDot Impact`}</title>
        <meta name="description" content="This intensive bootcamp prepares early-to-mid-career working professionals for operational roles in AI safety." />
        <meta property="og:title" content={`${PAGE_TITLE} | BlueDot Impact`} />
        <meta property="og:description" content="This intensive bootcamp prepares early-to-mid-career working professionals for operational roles in AI safety." />
        <meta property="og:image" content="https://bluedot.org/images/courses/ops-bootcamp-og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${PAGE_TITLE} | BlueDot Impact`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="BlueDot Impact" />
        <meta property="og:url" content="https://bluedot.org/courses/ops" />
      </Head>

      <MarketingHero title={PAGE_TITLE} subtitle={PAGE_TAGLINE} />

      <Section>
        <div className="ai-safety-ops-lander__intro flex flex-col gap-6 items-center text-center mx-auto max-w-3xl">
          <div className="flex flex-row flex-wrap justify-center gap-2 items-center">
            <div className="flex gap-2 items-center border border-color-border rounded-lg px-4 py-3 text-color-text">
              <FaCalendarAlt /> 6 hours total
            </div>
            <div className="flex gap-2 items-center border border-color-border rounded-lg px-4 py-3 text-color-text">
              <FaUserFriends /> Group discussions
            </div>
            <div className="flex gap-2 items-center border border-color-border rounded-lg px-4 py-3 text-color-text">
              <FaLaptop /> Online
            </div>
          </div>
          <CTALinkOrButton url={applicationUrl} withChevron>Apply now</CTALinkOrButton>
        </div>
      </Section>

      <Section>
        <div className="ai-safety-ops-lander__details-section w-full flex flex-col justify-center gap-12 items-center mx-auto max-w-3xl">
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

      <AiSafetyOpsBanner title="Join our AI Safety Operations Bootcamp and accelerate your impact in AI safety." ctaUrl={applicationUrl} />

      <Section className="mt-8">
        <TestimonialSubSection testimonials={allTestimonials} title="What people say about our other courses" />
      </Section>
    </>
  );
};

export default AiSafetyOpsLander;
