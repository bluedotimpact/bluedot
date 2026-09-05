import {
  CardShell, H3, H4, P,
} from '@bluedot/ui';

const CRITERIA = [
  {
    title: 'Evidence that you are already moving',
    body: (
      <>
        <P>We look for concrete recent action—not only an intention to enter the field. This might include research, writing, technical work, policy work, organising, professional achievements or strong analogous work.</P>
        <P>You do not need a conventional AI safety background, but we need enough evidence to judge your ability to carry out the proposed transition.</P>
      </>
    ),
  },
  {
    title: 'A grant that meaningfully improves the path',
    body: <P>Your transition does not need to be impossible without BlueDot. We want to understand what funding would change: its timing, focus, ambition, quality or likelihood of happening.</P>,
  },
  {
    title: 'Clear thinking under uncertainty',
    body: <P>Career plans rarely work exactly as expected. We look for people who can prioritise, identify important uncertainties, notice when an approach is failing and adapt without losing sight of the ultimate goal.</P>,
  },
  {
    title: 'A credible connection to catastrophic-risk reduction',
    body: <P>We fund transitions where success could plausibly contribute to reducing catastrophic risks from advanced AI or biological threats. We want to understand the causal connection between the work you plan to do and the outcomes it could ultimately affect.</P>,
  },
];

const WhatWeLookForSection = () => {
  return (
    <section className="section section-body career-transition-grant-criteria-section bg-color-canvas">
      <div className="w-full flex flex-col gap-8">
        <H3>What we look for</H3>
        <div className="grid grid-cols-1 gap-5 bd-md:grid-cols-2">
          {CRITERIA.map((criterion) => (
            <CardShell key={criterion.title} className="flex flex-col gap-3">
              <H4>{criterion.title}</H4>
              <div className="flex flex-col gap-3 text-bluedot-navy/80">
                {criterion.body}
              </div>
            </CardShell>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatWeLookForSection;
