import {
  A, CardShell, H3, H4, P,
} from '@bluedot/ui';

const FIELD_STRATEGY_URL = 'https://blog.bluedot.org/p/field-strategy-playbook';

const CRITERIA = [
  {
    title: 'Problem selection',
    body: <>You’ve thought hard about what challenges need to be overcome to make AI go well.</>,
  },
  {
    title: 'A well-reasoned hypothesis',
    body: <>You’ve got an initial <A href={FIELD_STRATEGY_URL}>strategy</A> for how you’re going to solve that problem.</>,
  },
  {
    title: 'Evidence you can make it happen',
    body: <>Things you’ve already built, research you’ve done, or progress you’ve made on the idea.</>,
  },
  {
    title: 'A concrete plan',
    body: <>What you’ll do in your first few months, and how you’ll know it’s working.</>,
  },
];

const WhatWeLookForSection = () => {
  return (
    <section className="section section-body bg-canvas">
      <div className="w-full flex flex-col gap-8">
        <H3>What we look for</H3>
        <div className="grid grid-cols-1 gap-5 bd-md:grid-cols-2">
          {CRITERIA.map((criterion) => (
            <CardShell key={criterion.title} className="flex flex-col gap-4">
              <H4>{criterion.title}</H4>
              <P className="text-secondary">{criterion.body}</P>
            </CardShell>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatWeLookForSection;
