import { H3, H4, P } from '@bluedot/ui';
import { Pill } from '../Pill';

const EXPECTATIONS = [
  {
    cadence: 'Upfront',
    title: 'Full-time commitment',
    body: 'This is not something to do alongside a full or part-time role.',
  },
  {
    cadence: 'Weekly',
    title: 'Regular progress updates',
    body: 'Brief updates on what you produced, what evidence you gathered, what changed in your thinking, progress against milestones and any decisions you need to make.',
  },
  {
    cadence: 'Ongoing',
    title: 'Structured check-ins',
    body: 'Conversations with your BlueDot point of contact to assess progress, revisit important assumptions and decide whether to continue, change or narrow the plan.',
  },
  {
    cadence: 'At the end',
    title: 'Grant-end and follow-up reporting',
    body: 'A short report covering what you produced, what you learned, how your plans changed and what you will do next. We may also ask for a brief follow-up after the grant so we can improve future funding decisions.',
  },
];

const ExpectationsSection = () => {
  return (
    <section className="section section-body career-transition-grant-expectations-section">
      <div className="w-full flex flex-col gap-6">
        <H3>What we expect from you</H3>

        <ul className="flex flex-col divide-y divide-bluedot-navy/10 border-y border-bluedot-navy/10">
          {EXPECTATIONS.map((item) => (
            <li
              key={item.title}
              className="flex flex-col bd-md:flex-row bd-md:items-baseline gap-3 bd-md:gap-10 py-6"
            >
              <div className="bd-md:w-40 bd-md:shrink-0">
                <Pill>{item.cadence}</Pill>
              </div>
              <div className="flex flex-col gap-2">
                <H4>
                  {item.title}
                </H4>
                <P className="text-bluedot-navy/80">
                  {item.body}
                </P>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default ExpectationsSection;
