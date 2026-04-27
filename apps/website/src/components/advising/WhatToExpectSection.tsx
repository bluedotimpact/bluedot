import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

const CALL_FORMATS = [
  {
    label: 'Intros',
    body: 'to specific people, orgs or projects',
  },
  {
    label: 'Recommendations',
    body: 'for jobs, resources or programs',
  },
  {
    label: 'Exercises',
    body: 'for you to work through to gain clarity on next steps',
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
          During the call, we will help you to clarify how you can contribute to AI safety through a combination of:
        </P>

        <ul className="list-disc pl-6 flex flex-col gap-2">
          {CALL_FORMATS.map(({ label, body }) => (
            <li key={label} className="text-bluedot-navy/80 leading-[1.6]">
              <strong className="text-bluedot-navy">{label}</strong> {body}
            </li>
          ))}
        </ul>

        <P>Most calls end with a scheduled 20-min follow-up call in 1-2 weeks.</P>
      </div>
    </section>
  );
};

export default WhatToExpectSection;
