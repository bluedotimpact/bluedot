import { P, Section } from '@bluedot/ui';

const EXPECTATIONS = [
  {
    cadence: 'Upfront',
    title: 'Full-time commitment',
    body: 'This is not something to do alongside a full or part-time role.',
  },
  {
    cadence: 'Weekly',
    title: 'Progress updates',
    body: 'Short async updates to your BlueDot point of contact on what you did, who you talked to, what you learned, and how your thinking is evolving.',
  },
  {
    cadence: 'Quarterly',
    title: 'Check-in',
    body: 'Every three months, a more structured conversation to review progress and discuss what support you need.',
  },
  {
    cadence: 'At the end',
    title: 'Grant report',
    body: 'A short (1-2 page) summary of what you achieved during the grant and what you will be doing next.',
  },
];

const ExpectationsSection = () => {
  return (
    <Section className="career-transition-grant-expectations-section" title="What we expect from you">
      <ul className="max-w-[960px] flex flex-col divide-y divide-bluedot-darker/10 border-y border-bluedot-darker/10">
        {EXPECTATIONS.map((item) => (
          <li
            key={item.title}
            className="flex flex-col min-[680px]:flex-row min-[680px]:items-baseline gap-3 min-[680px]:gap-10 py-6"
          >
            <div className="min-[680px]:w-[160px] min-[680px]:shrink-0">
              <span className="inline-flex items-center rounded-full bg-bluedot-darker/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-bluedot-darker/70">
                {item.cadence}
              </span>
            </div>
            <div className="flex flex-col gap-2 max-w-[720px]">
              <h3 className="text-[18px] min-[680px]:text-[20px] font-semibold text-bluedot-darker">
                {item.title}
              </h3>
              <P className="text-size-sm leading-[1.65] text-bluedot-darker/80">
                {item.body}
              </P>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
};

export default ExpectationsSection;
