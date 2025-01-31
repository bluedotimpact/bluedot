import { CTALinkOrButton, Section } from '@bluedot/ui';

const StorySection = () => {
  return (
    <Section className="story-section" title="Our story">
      <div className="story-section__container flex flex-row gap-4">
        <img className="story-section__image w-[570px] rounded-2xl" src="/images/team/team_1.jpg" alt="BlueDot Impact team" />
        <div className="story-section__text-container flex flex-col gap-5">
          <p>BlueDot Impact was founded in August 2022, and grew out of a non-profit supporting students at the University of Cambridge to pursue high-impact careers. To learn more, check out this <a className="underline" href="https://hearthisidea.com/episodes/erwan/">podcast interview</a> and our <a className="underline" href="https://bluedot.org/blog">blog</a>.
          </p>
          <p>Over the past 2 years, we've supported 2,500 people to learn about AI safety and pandemic preparedness, and our alumni work in critical roles across government and industry. In 2024, we will train ~3x more people than 2023 by running each of our three existing courses every four months (AI Alignment, AI Governance, Pandemics).</p>
          <h3>Our commitment to AI Safety</h3>
          <p>BlueDot Impact was founded in August 2022, and grew out of a non-profit supporting students at the University of Cambridge to pursue high-impact careers. To learn more, check out this podcast interview and our blog.</p>
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
