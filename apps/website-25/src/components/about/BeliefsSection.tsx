import { Section, ValueCard } from '@bluedot/ui';

const BeliefsSection = () => {
  return (
    <Section className="beliefs-section" title="Our core beliefs">
      <div className="beliefs-section__container flex gap-8 overflow-y-scroll">
        <ValueCard
          icon="icons/fast.svg"
          title="AGI could arrive soon, and we’re dangerously unprepared"
          description="Human-level AI will likely be built within years, not decades. Our technical, political, and social systems are not prepared to handle it safely, and the default path leads to catastrophic outcomes."
        />
        <ValueCard
          icon="icons/care.svg"
          title="What we do now matters"
          description="The future of AI isn't set in stone. Our choices today will determine whether this technology helps or harms humanity."
        />
        <ValueCard
          icon="icons/solvers.svg"
          title="The right people at key moments rewrite history"
          description="Throughout history, capable individuals in key positions have steered powerful technologies toward better outcomes. By identifying, training, and mobilising exceptional people, we can guide AI toward a safe and beneficial future."
        />
        <ValueCard
          icon="icons/solvers.svg"
          title="We need urgency, wisdom and optimism"
          description="The stakes are vast and time is short, but panic and fatalism do more harm than good. We need rapid, coordinated action informed by evidence and guided by hope."
        />
      </div>
    </Section>
  );
};

export default BeliefsSection;
