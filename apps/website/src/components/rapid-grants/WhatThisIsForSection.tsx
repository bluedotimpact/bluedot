import { P } from '@bluedot/ui';
import { RAPID_GRANT_APPLICATION_URL } from '../grants/grantPrograms';

// TODO: replace with pageSectionHeadingClass from ../PageListRow once #2309 lands
const SECTION_HEADING_CLASS = 'text-[24px] font-bold tracking-[-0.4px] leading-[1.333] text-bluedot-navy';

const DECISION_CARDS = [
  {
    title: 'What we fund',
    body: 'Concrete work where a specific cost is the bottleneck - a research project, an event series, community building, or fieldwork. We fund compute and API credits, events and meetups, research access, travel, community chapters, project tooling, and high-impact wildcard projects that do not fit a category yet.',
  },
  {
    title: 'What needs a stronger case',
    body: 'General-purpose equipment, productivity subscriptions, or vague plans without evidence of work already underway. Stipends and living expenses are not our default, but we consider them for high-impact work - apply and make the argument.',
  },
];

const WhatThisIsForSection = () => {
  return (
    <section className="section section-body rapid-grants-what-section">
      <div className="w-full min-[680px]:max-w-[1120px] min-[680px]:mx-auto flex flex-col gap-6">
        <h3 className={SECTION_HEADING_CLASS}>What this program is for</h3>

        <div className="flex flex-col gap-5">
          <P>Over the past few months, we have given out nearly $50,000 in small grants to people in the BlueDot community. Now we are going bigger.</P>
          <P>Rapid Grants fund whatever it takes to remove the barrier between talented people, great ideas and their best work on AI safety. We fund everything from compute for projects, events you want to run, travel to hubs, community building, and more.</P>
          <P>
            If you are unsure whether to apply, the default is simple:{' '}
            <a
              href={RAPID_GRANT_APPLICATION_URL}
              className="font-medium text-bluedot-navy underline underline-offset-4"
            >
              apply
            </a>
            .
          </P>
        </div>

        <div className="pt-2 grid gap-4 min-[680px]:grid-cols-2">
          {DECISION_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-[16px] border border-bluedot-navy/10 bg-white p-6 lg:p-8 flex flex-col gap-3"
            >
              <h4 className="text-[18px] min-[680px]:text-[20px] font-semibold leading-tight text-bluedot-navy">
                {card.title}
              </h4>
              <P className="text-[15px] min-[680px]:text-[16px] leading-[1.7] text-bluedot-navy/70">
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
