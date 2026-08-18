import { H3, H4, P } from '@bluedot/ui';
import { Pill } from '../Pill';

const PROGRAMME = [
  {
    day: 'Day 1',
    title: 'Build the map',
    body: 'Examine major AI-risk threat models, intervention families, organisational strategies, relevant history, and the parts of the field map that remain contested.',
  },
  {
    day: 'Day 2',
    title: 'Understand the cruxes',
    body: 'Steelman competing theories of change and distinguish empirical disagreements, strategic disagreements, and value judgements.',
  },
  {
    day: 'Day 3',
    title: 'Apply the map',
    body: 'Reconstruct and red-team organisational theories of change, then connect individual skills and comparative advantage to specific bottlenecks and alternatives.',
  },
  {
    day: 'Day 4',
    title: 'Make the decision testable',
    body: 'Revise the decision memo, receive peer and adviser challenge, define failure indicators, and design a 30-day action and a reversible 90-day plan.',
  },
];

const FourDayProgrammeSection = () => {
  return (
    <section className="section section-body context-week-programme-section">
      <div className="w-full flex flex-col gap-6">
        <div className="max-w-prose flex flex-col gap-4">
          <H3>The four-day programme</H3>
          <P className="text-bluedot-navy/80">
            Participants work in small groups and receive an early diagnostic one-to-one and
            a final challenge conversation. Guests working across different AI-safety
            strategies join selected sessions.
          </P>
        </div>

        <ol className="flex flex-col divide-y divide-bluedot-navy/10 border-y border-bluedot-navy/10">
          {PROGRAMME.map((item) => (
            <li
              key={item.day}
              className="flex flex-col bd-md:flex-row bd-md:items-baseline gap-3 bd-md:gap-10 py-6"
            >
              <div className="bd-md:w-40 bd-md:shrink-0">
                <Pill>{item.day}</Pill>
              </div>
              <div className="max-w-prose flex flex-col gap-2">
                <H4>{item.title}</H4>
                <P className="text-bluedot-navy/80">{item.body}</P>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default FourDayProgrammeSection;
