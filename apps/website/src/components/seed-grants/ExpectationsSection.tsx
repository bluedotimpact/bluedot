import {
  H3, H4, P, Tag,
} from '@bluedot/ui';

const EXPECTATIONS = [
  {
    cadence: 'Monthly',
    title: 'A short update',
    body: 'What you did, what’s next and where you’re stuck. A few lines is fine.',
  },
  {
    cadence: 'At the end',
    title: 'A short report',
    body: 'How it went against your plan, and any follow-on funding you raised.',
  },
];

const ExpectationsSection = () => {
  return (
    <section className="section section-body seed-grant-expectations-section">
      <div className="w-full flex flex-col gap-6">
        <H3>What we expect from you</H3>
        <P className="text-secondary">We keep this light.</P>

        <ul className="flex flex-col divide-y divide-subtle border-y border-subtle">
          {EXPECTATIONS.map((item) => (
            <li
              key={item.title}
              className="flex flex-col bd-md:flex-row bd-md:items-baseline gap-3 bd-md:gap-10 py-6"
            >
              <div className="bd-md:w-40 bd-md:shrink-0">
                <Tag shape="pill">{item.cadence}</Tag>
              </div>
              <div className="flex flex-col gap-2">
                <H4>{item.title}</H4>
                <P className="text-secondary">{item.body}</P>
              </div>
            </li>
          ))}
        </ul>

        <P className="text-secondary">
          If you stop working on the project before the grant ends, tell us and return the unspent funds.
        </P>
      </div>
    </section>
  );
};

export default ExpectationsSection;
