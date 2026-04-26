import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';
import { RAPID_GRANT_APPLICATION_URL } from '../grants/grantPrograms';

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
  return (
    <section className="section section-body rapid-grants-what-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>Who this is for</h3>

        <div className="flex flex-col gap-5">
          <P>We&apos;ve given out nearly $50,000 in small grants to the BlueDot community over the past few months. Now we&apos;re scaling up. Bigger grants, more of them.</P>
          <P>
            If in doubt,{' '}
            <a
              href={RAPID_GRANT_APPLICATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-bluedot-navy underline underline-offset-4"
            >
              apply
            </a>
            .
          </P>
        </div>

        <div className="pt-2 grid gap-4 bd-md:grid-cols-2">
          {DECISION_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-[16px] border border-bluedot-navy/10 bg-white p-6 lg:p-8 flex flex-col gap-3"
            >
              <h4 className="text-[18px] bd-md:text-[20px] font-semibold leading-tight text-bluedot-navy">
                {card.title}
              </h4>
              <P className="text-[15px] bd-md:text-[16px] leading-[1.7] text-bluedot-navy/70">
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
