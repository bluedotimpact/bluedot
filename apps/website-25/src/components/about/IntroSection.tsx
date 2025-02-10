import { Section } from '@bluedot/ui';

const IntroSection = ({ title }: { title: string }) => {
  return (
    <Section className="intro-section" title={title}>
      <div className="intro-section__container flex lg:flex-row flex-col gap-4">
        <div className="intro-section__text-container flex flex-col gap-5">
          <p>Humanity faces unprecedented challenges from transformative AI (TAI) which could profoundly reshape our future. Current AI systems already exhibit concerning behaviours, and as they become more powerful, misalignment between their actions, human intentions and societal values could lead to catastrophic outcomes.</p>
          <p>BlueDot Impact exists to safeguard humanity from these risks by building and accelerating the AI safety field.  We’ve trained over 4,000 professionals and helped hundreds land roles at organisations like Anthropic and the UK’s AI Safety Institute. We’ve built a strong foundation of deep knowledge in how to communicate complex concepts, close relationships across the field, and expertise in talent development. However, urgency and the magnitude of AI risk demands we do much more.</p>
        </div>
        <img className="intro-section__image max-w-[570px] w-full h-auto rounded-2xl" src="/images/team/team_1.jpg" alt="BlueDot Impact team" />
      </div>
    </Section>
  );
};

export default IntroSection;
