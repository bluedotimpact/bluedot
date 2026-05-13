import { pageSectionHeadingClass } from '../PageListRow';

const EXAMPLES = [
  'A biosecurity stream for MATS or other fellowships',
  'Bootcamps to bring in senior ops talent',
  'Creator fellowships to generate greater public awareness on AI safety',
  'Writing fellowships to translate complex ideas in AI safety for specific audiences',
  'Fellowships to bring in particular experts into the field',
];

const WhatCouldYouBuildSection = () => {
  return (
    <section className="section section-body builder-week-what-could-you-build-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>What could you build?</h3>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          {EXAMPLES.map((example) => (
            <li key={example}>{example}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default WhatCouldYouBuildSection;
