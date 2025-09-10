import { CTALinkOrButton, Section } from '@bluedot/ui';
import { ROUTES } from '../../lib/routes';
import { P } from '../Text';

const StorySection = () => {
  return (
    <Section className="story-section" title="About us">
      <div className="story-section__container flex lg:flex-row flex-col gap-space-between">
        <div className="story-section__text-container flex flex-col gap-5">
          <P>BlueDot Impact is a non-profit building educational courses to help ensure powerful emerging technologies benefit humanity.</P>
          <P>Since 2021, we have trained over 4,500 professionals worldwide – from technical staff at frontier AI labs to government policymakers. Our alumni work on critical challenges at organisations like Anthropic, DeepMind, and the UK's AI Security Institute.</P>
          <P>Working closely with leading organisations, we rapidly develop new courses to address emerging challenges and help talented people find roles where they can have the greatest impact.</P>
          <CTALinkOrButton
            variant="secondary"
            url={ROUTES.about.url}
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
