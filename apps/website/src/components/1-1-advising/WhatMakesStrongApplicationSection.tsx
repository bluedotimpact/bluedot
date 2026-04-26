import { pageSectionHeadingClass } from '../PageListRow';

const CRITERIA = [
  {
    title: 'Specific options.',
    body: 'You can name what you\'re deciding between or are stuck on. You need help figuring out where to go next.',
  },
  {
    title: 'A track record of action.',
    body: 'You can describe what you\'ve tried so far and what did or didn\'t work.',
  },
  {
    title: 'A personal theory of impact.',
    body: 'Your best guess about how your specific skills can contribute to AI safety.',
  },
];

const WhatMakesStrongApplicationSection = () => {
  return (
    <section className="section section-body advising-strong-application-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>What makes a strong application</h3>

        <ul className="flex flex-col gap-4">
          {CRITERIA.map((item) => (
            <li key={item.title} className="text-bluedot-navy/80 leading-[1.6]">
              <strong className="text-bluedot-navy">{item.title}</strong>
              {' '}
              {item.body}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default WhatMakesStrongApplicationSection;
