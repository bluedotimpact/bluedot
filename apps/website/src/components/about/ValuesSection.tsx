import { H3, P } from '@bluedot/ui';

const values = [
  {
    title: 'Our job is the mission',
    description: 'Do what the mission needs, even if it\'s weird, uncomfortable, difficult, or not part of your role.',
  },
  {
    title: 'What is the goal?',
    description: 'Obsessively ask yourself this, write your answer in plain English, work out your biggest blocker and how to fix it, then let small fires burn.',
  },
  {
    title: 'Don\'t wait for permission',
    description: 'When a decision is easy to undo, take action fast, and try things before you conclude they can\'t be done.',
  },
  {
    title: 'Public by default',
    description: 'Give everyone enough context to build on your work by posting regular updates, sharing wins and failures, and avoiding DMs.',
  },
  {
    title: 'Connect with people first',
    description: 'Before you work with someone or try to persuade them, be curious about their story and what matters to them, help them feel comfortable, and let them get to know you.',
  },
  {
    title: 'Actionable feedback is a gift',
    description: 'Challenge decisions and share feedback quickly and in public, especially with people who seem more senior or smarter than you, without being an asshole.',
  },
] as const;

const ValuesSection = () => {
  return (
    <section id="principles" className="values-section section section-body">
      <H3 className="mb-6">How we work</H3>
      <ul className="flex flex-col gap-3 list-disc pl-5">
        {values.map((value) => (
          <li key={value.title}>
            {/* No colon after a title that already ends in a question mark */}
            <P><strong>{value.title.endsWith('?') ? value.title : `${value.title}:`}</strong> {value.description}</P>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ValuesSection;
