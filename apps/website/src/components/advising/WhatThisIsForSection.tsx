import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

const HELP_BULLETS = [
  'Prioritise the AI safety work that fits their specific skills and background',
  'Structure how they explore when they have several options on the table',
  'Get warm intros to people in the field, including hiring managers at AI safety orgs',
];

const WhatThisIsForSection = () => {
  return (
    <section className="section section-body advising-what-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>What this is for</h3>

        <P>We&apos;ve had hundreds of advising calls, where we&apos;ve helped people:</P>

        <ul className="list-disc pl-6 flex flex-col gap-2">
          {HELP_BULLETS.map((item) => (
            <li key={item} className="text-bluedot-navy/80 leading-[1.6]">
              {item}
            </li>
          ))}
        </ul>

        <P>
          Our advisees have typically done a BlueDot course (or have equivalent context) and have ideas for how they could contribute to AI safety, but struggle to figure out where to focus. These calls help to clarify their next steps so they can make an impactful contribution as soon as possible.
        </P>
      </div>
    </section>
  );
};

export default WhatThisIsForSection;
