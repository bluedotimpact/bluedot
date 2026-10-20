import { H3, H4, P } from '@bluedot/ui';

const beliefs = [
  {
    title: 'AGI could arrive soon, and society isn\'t ready',
    description: 'Human-level AI could be only a few years away. AI companies are moving fast. The institutions meant to govern them are moving much slower.',
  },
  {
    title: 'A few people at key moments can change history',
    description: 'In the past, a small number of people in the right place at the right time have steered powerful technologies toward better outcomes. We find and prepare those people.',
  },
  {
    title: 'We need urgency and wisdom',
    description: 'The stakes are huge and time is short. But panic leads to bad decisions. We need to act fast and think clearly.',
  },
] as const;

const BeliefsSection = () => {
  return (
    <section className="beliefs-section section section-body">
      <H3 className="mb-6">What we believe</H3>
      <div className="flex flex-col gap-6">
        {beliefs.map((belief) => (
          <div key={belief.title}>
            <H4 className="mb-2">{belief.title}</H4>
            <P>{belief.description}</P>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BeliefsSection;
