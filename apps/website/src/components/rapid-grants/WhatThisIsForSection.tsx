import { H3, H4, P } from '@bluedot/ui';
import { useGrantApplicationUrl } from '../grants/useGrantApplicationUrl';

const DECISION_CARDS = [
  {
    title: 'What we fund',
    body: 'Impactful work where money is the bottleneck. Compute and API credits, events and meetups, research access, travel, community chapters, project tooling. Wildcards welcome. Pitch us.',
  },
  {
    title: 'What needs a stronger case',
    body: 'General equipment, productivity subscriptions, or plans you haven\'t started yet. Stipends and living expenses aren\'t our usual scope, but apply and make the case if yours is high-impact.',
  },
];

const WhatThisIsForSection = () => {
  const applicationUrl = useGrantApplicationUrl('rapid-grants');

  return (
    <section className="section section-body rapid-grants-what-section">
      <div className="w-full flex flex-col gap-6">
        <H3>Who this is for</H3>

        <div className="flex flex-col gap-5">
          <P>For anyone working on concrete AI safety projects. Research, events, community building, tooling, compute.</P>
          {applicationUrl && (
            <P>
              If in doubt,{' '}
              <a
                href={applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-bluedot-navy underline underline-offset-4"
              >
                apply
              </a>
              .
            </P>
          )}
        </div>

        <div className="pt-2 grid gap-4 bd-md:grid-cols-2">
          {DECISION_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-bluedot-navy/10 bg-white p-6 lg:p-8 flex flex-col gap-3"
            >
              <H4>
                {card.title}
              </H4>
              <P className="text-bluedot-navy/70">
                {card.body}
              </P>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatThisIsForSection;
