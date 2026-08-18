import {
  A, H3, H4, P,
} from '@bluedot/ui';

const CRITERIA = [
  'Strong evidence of ability and execution.',
  'A gap in field context or strategic reasoning that is affecting the decision.',
  'Willingness to state uncertainty, engage with serious disagreement, and update.',
  'A realistic opportunity to act on what they learn.',
  'Experience or expertise that will improve the cohort\'s collective reasoning.',
];

const WhoItIsForSection = () => {
  return (
    <section className="section section-body context-week-who-section">
      <div className="w-full flex flex-col gap-8">
        <div className="max-w-prose flex flex-col gap-6">
          <H3>Who it is for</H3>
          <P>
            Every participant should have an important career or project decision due within
            roughly 90 days. We will prioritise people who have:
          </P>
          <ul className="list-disc pl-6 flex flex-col gap-2 text-bluedot-navy/80">
            {CRITERIA.map((criterion) => <li key={criterion}>{criterion}</li>)}
          </ul>
        </div>

        <div className="max-w-prose rounded-xl border border-bluedot-navy/10 bg-bluedot-lighter/20 p-6 bd-md:p-8 flex flex-col gap-3">
          <H4>Context Week or Incubator Week?</H4>
          <P className="text-bluedot-navy/80">
            Context Week is for deciding which problem, intervention, role, or organisation
            to pursue, and why. It is upstream of Incubator Week, not a shorter version of it.
          </P>
          <P className="text-bluedot-navy/80">
            If you already have a specific intervention, a first user or decision-maker, and
            a week-shaped test of a load-bearing assumption,{' '}
            <A href="/programs/incubator-week">Incubator Week</A> is likely to be a better fit.
          </P>
        </div>
      </div>
    </section>
  );
};

export default WhoItIsForSection;
