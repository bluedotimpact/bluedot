import { Section } from '@bluedot/ui';

import React from 'react';

const IntroSection = ({ title }: { title: string }) => {
  return (
    <Section className="intro-section" title={title}>
      <div className="intro-section__container flex flex-row gap-28 my-16">
        <div className="intro-section__text-container flex flex-col gap-5">
          <p>Humanity faces unprecedented challenges from transformative AI (TAI), which could profoundly reshape our future. Current AI systems already exhibit concerning behaviours, and as they become more powerful, misalignment between their actions, human intentions and societal values could lead to catastrophic outcomes.</p>
          <p>BlueDot Impact exists to safeguard humanity from these risks by building and accelerating the AI safety field. Thus far, we’ve trained over 3,000 professionals and helped hundreds land roles at organisations like Anthropic and the UK’s AI Safety Institute. We’ve built a strong foundation, including deep knowledge of how to communicate complex concepts, close relationships across the field, and expertise in talent development. However, the urgency and magnitude of AI risks demand we do much more.</p>
        </div>
        <img className="intro-section__image w-[570px] rounded-2xl" src="/images/team/team_1.jpg" alt="BlueDot Impact team" />
      </div>
    </Section>
  );
};

export default IntroSection;
