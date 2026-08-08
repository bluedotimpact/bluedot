import { H3, P } from '@bluedot/ui';

const EXAMPLE_USES = [
  'Produce research, policy work, technical work or another substantial output',
  'Build evidence that you can contribute at a higher level',
  'Test an uncertain but potentially high-impact career path',
  'Address a specific skill or experience bottleneck',
  'Move into a role or establish a sustained independent contribution',
];

const WhatThisIsForSection = () => {
  return (
    <section className="section section-body career-transition-grant-what-section">
      <div className="w-full flex flex-col gap-6">
        <H3>What this is for</H3>

        <div className="flex flex-col gap-5 max-w-4xl">
          <P>
            Career Transition Grants support people who are ready to spend a defined period working full-time on a transition into impactful AI safety or biosecurity work.
          </P>
          <P>You might use the grant to:</P>
          <ul className="flex flex-col gap-3 pl-6 list-disc text-size-sm leading-relaxed text-bluedot-navy/80">
            {EXAMPLE_USES.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <P>
            We expect plans to change. What matters is that you can make progress, learn from evidence and produce something valuable even if your original path does not work.
          </P>
          <P>
            This program is primarily for personal, full-time transitions. If your main request is to fund a discrete project, event or organisational activity, another BlueDot funding route may be a better fit. You can still apply if you are unsure—we will help route the request.
          </P>
        </div>
      </div>
    </section>
  );
};

export default WhatThisIsForSection;
