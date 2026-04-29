import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

const UNIVERSAL_OUTCOMES = [
  {
    label: 'An honest assessment',
    body: 'of whether we\'re the right fit right now',
  },
  {
    label: 'Recommendations',
    body: 'for jobs, resources or programs that fit your current stage',
  },
];

const RIGHT_FIT_OUTCOMES = [
  {
    label: 'Intros',
    body: 'to specific people, orgs or projects',
  },
  {
    label: 'Exercises',
    body: 'for you to work through to gain clarity on next steps',
  },
  {
    label: 'A scheduled follow-up call',
    body: 'in 1-2 weeks',
  },
];

const WhatToExpectSection = () => {
  return (
    <section className="section section-body advising-expect-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>What to expect</h3>

        <P>
          When you apply, you&apos;ll share with us the options you&apos;re considering and what you&apos;ve done so far to make progress.
        </P>

        <P>
          During the call, we will dig deeper on what you&apos;ve done, what you&apos;re considering and where you&apos;re stuck. We aim to help you to clarify how you can contribute to AI safety.
        </P>

        <P>By the end of the call, you&apos;ll walk away with:</P>

        <ul className="list-disc pl-6 flex flex-col gap-2">
          {UNIVERSAL_OUTCOMES.map(({ label, body }) => (
            <li key={label} className="text-bluedot-navy/80 leading-[1.6]">
              <strong className="text-bluedot-navy">{label}</strong> {body}
            </li>
          ))}
        </ul>

        <P>If we&apos;re the right fit, you&apos;ll also leave with some combination of:</P>

        <ul className="list-disc pl-6 flex flex-col gap-2">
          {RIGHT_FIT_OUTCOMES.map(({ label, body }) => (
            <li key={label} className="text-bluedot-navy/80 leading-[1.6]">
              <strong className="text-bluedot-navy">{label}</strong> {body}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default WhatToExpectSection;
