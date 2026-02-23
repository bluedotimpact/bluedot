import { P, Section } from '@bluedot/ui';

const values = [
  {
    title: 'Own the mission',
    description: 'We all take responsibility for achieving our mission, not just getting tasks done. If something important needs doing and it\'s not anyone\'s job, it\'s your job.',
  },
  {
    title: 'Think hard and move fast',
    description: 'We think carefully about what matters most, then we pursue it with urgency. Speed in the wrong direction is wasted effort.',
  },
  {
    title: 'Say the uncomfortable truth',
    description: 'We give feedback directly and receive it generously. The mission is too important for politeness to get in the way of honesty.',
  },
] as const;

const ValuesSection = () => {
  return (
    <Section title="Values" className="values-section">
      <div className="flex flex-col gap-6">
        {values.map((value) => (
          <div key={value.title}>
            <h3 className="bluedot-h4 mb-2">{value.title}</h3>
            <P>{value.description}</P>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default ValuesSection;
