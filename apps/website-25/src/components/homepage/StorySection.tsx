import { CTALinkOrButton, Section } from '@bluedot/ui';

const StorySection = () => {
  return (
    <Section className="story-section" title="About us">
      <div className="story-section__container flex lg:flex-row flex-col gap-space-between">
        <img className="story-section__image max-w-[570px] w-full max-h-[365px] rounded-2xl" src="/images/team/team_1.jpg" alt="BlueDot Impact team" />
        <div className="story-section__text-container flex flex-col gap-5">
          <p>BlueDot Impact is a non-profit building educational courses to help ensure powerful emerging technologies benefit humanity.</p>
          <p>Since 2021, we have trained over 4,500 professionals worldwide – from technical staff at frontier AI labs to government policymakers. Our alumni work on critical challenges at organisations like Anthropic, DeepMind, and the UK's AI Security Institute.</p>
          <p>Working closely with leading organisations, we rapidly develop new courses to address emerging challenges and help talented people find roles where they can have the greatest impact.</p>
          <CTALinkOrButton
            variant="secondary"
            url="/about"
            withChevron
          >
            Learn more about us
          </CTALinkOrButton>
        </div>
      </div>
    </Section>
  );
};

export default StorySection;
