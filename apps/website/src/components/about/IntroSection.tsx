import { P, Section } from '@bluedot/ui';

const IntroSection = () => {
  return (
    <Section className="intro-section" title="Who we are">
      <div className="intro-section__text-container flex flex-col gap-5">
        <P>In 2021, a handful of us at Cambridge wanted to work on AI safety, but couldn&apos;t find where to start. Important ideas and arguments were scattered across the internet. There were no courses, no career paths, and few people to talk to. So we started running reading groups.</P>
        <P>Those reading groups evolved into the BlueDot courses. We&apos;ve trained over 7,000 people in AI safety, governance and biosecurity, and hundreds of our graduates now work at Anthropic, DeepMind, and UK AISI.</P>
        <P>But training alone isn&apos;t enough. We give out grants to support career transitions, and we help exceptional people land impactful roles or start new organisations. Our goal isn&apos;t just to educate people, it&apos;s to get them working on the most important problems.</P>
        <P>The gap between how fast AI is advancing and how fast the safety and security workforce is growing is the most dangerous mismatch of our time. We&apos;re a small team based in San Francisco and London working as fast as we can to close it.</P>
      </div>
    </Section>
  );
};

export default IntroSection;
