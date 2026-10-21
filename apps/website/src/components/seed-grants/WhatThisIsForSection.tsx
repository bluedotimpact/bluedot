import { A, H3, P } from '@bluedot/ui';
import { ROUTES } from '../../lib/routes';

const EXAMPLE_USES = [
  'Living costs, so you can work on the project full-time',
  'Compute, tools, equipment and other running costs',
  'Travel to meet collaborators, users and funders',
];

const WhatThisIsForSection = () => {
  return (
    <section className="section section-body seed-grant-what-section">
      <div className="w-full flex flex-col gap-6">
        <H3>What this is for</H3>

        <div className="flex flex-col gap-5 max-w-4xl">
          <P>
            Seed Grants fund the first 6-12 months of a new project or organization that reduces risks from advanced AI or biological threats. They cover the stage before you&apos;re ready for larger institutional funding: testing the idea, building a first version, finding collaborators and early users, and developing a proposal that bigger funders can back.
          </P>
          <P>You can use a Seed Grant for:</P>
          <ul className="flex flex-col gap-3 pl-6 list-disc text-size-sm leading-relaxed text-primary">
            {EXAMPLE_USES.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <P>
            Looking for something to build? Our <A href={ROUTES.missions.url}>missions page</A> lists problems we&apos;d like to see someone take on. You don&apos;t need to pick one of them to apply.
          </P>
        </div>
      </div>
    </section>
  );
};

export default WhatThisIsForSection;
