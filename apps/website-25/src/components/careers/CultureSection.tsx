import { Section } from '@bluedot/ui';

const CultureSection = () => {
  return (
    <Section className="culture-section" title="Our culture">
      <div className="culture-section__container flex lg:flex-row flex-col gap-space-between">
        <div className="culture-section__text-container flex flex-col gap-5">
          <p>At BlueDot Impact, our culture is defined by high agency, rapid experimentation, and direct feedback. We move fast and iterate quickly because AI capabilities are advancing rapidly and our work is time-sensitive.</p>
          <p>But speed doesn't mean sacrificing support – we invest heavily in each other's growth and wellbeing, creating an environment where ambitious, mission-driven people can do their best work.</p>
          <p>We seek exceptional people who combine a sense of urgency with the empathy to help others thrive, whether that's fellow team members or the thousands of professionals in our global community.</p>
        </div>
        <img className="culture-section__image max-w-[570px] w-full h-auto rounded-2xl" src="/images/team/team_1.jpg" alt="BlueDot Impact team" />
      </div>
    </Section>
  );
};

export default CultureSection;
