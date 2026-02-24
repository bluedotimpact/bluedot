import { P, Section } from '@bluedot/ui';

const beliefs = [
  {
    title: 'AGI could arrive soon, and society is dangerously unprepared',
    description: 'Human-level AI is likely years away, not decades. AI companies are moving at a blistering pace, while the institutions meant to govern it are moving at a fraction of the speed required.',
  },
  {
    title: 'People at key moments rewrite history',
    description: 'The future of AI isn\'t set in stone. Throughout history, a small number of people in the right positions at the right time have steered powerful technologies toward better outcomes. We find and prepare those people.',
  },
  {
    title: 'We need urgency and wisdom',
    description: 'The stakes are vast and time is short, but panic and fatalism lead to bad decisions. We need thoughtful and rapid action.',
  },
] as const;

const BeliefsSection = () => {
  return (
    <Section title="Core beliefs" className="beliefs-section">
      <div className="flex flex-col gap-6">
        {beliefs.map((belief) => (
          <div key={belief.title}>
            <h3 className="bluedot-h4 mb-2">{belief.title}</h3>
            <P>{belief.description}</P>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default BeliefsSection;
