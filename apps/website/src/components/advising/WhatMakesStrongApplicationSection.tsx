import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

const CRITERIA = [
  {
    title: 'Specific options',
    body: 'You can name what you\'re deciding between or are stuck on. You need help figuring out where to go next.',
  },
  {
    title: 'A track record of action',
    body: 'You can describe what you\'ve tried so far and what did or didn\'t work.',
  },
  {
    title: 'A personal theory of impact',
    body: 'Your best guess about how your specific skills can contribute to AI safety.',
  },
];

const WhatMakesStrongApplicationSection = () => {
  return (
    <section className="section section-body advising-strong-application-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>What makes a strong application</h3>

        <div className="pt-2 grid gap-4 bd-md:gap-5 grid-cols-1 bd-md:grid-cols-2 lg:grid-cols-3">
          {CRITERIA.map((item, index) => (
            <div
              key={item.title}
              className="relative rounded-lg border border-bluedot-navy/10 bg-white px-6 py-6 flex flex-col gap-4"
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-bluedot-navy/40">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h4 className="text-[18px] bd-md:text-[20px] font-semibold leading-tight text-bluedot-navy">
                {item.title}
              </h4>
              <P className="text-size-sm leading-[1.7] text-bluedot-navy/75">
                {item.body}
              </P>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatMakesStrongApplicationSection;
