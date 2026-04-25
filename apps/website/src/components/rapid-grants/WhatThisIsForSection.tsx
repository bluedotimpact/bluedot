import { P, Section } from '@bluedot/ui';
import { RAPID_GRANT_APPLICATION_URL } from '../grants/grantPrograms';

const DECISION_CARDS = [
  {
    title: 'Good fit',
    accentClassName: 'bg-bluedot-normal',
    eyebrowClassName: 'text-bluedot-dark',
    body: 'You are doing something concrete - a research project, an event series, community building, or fieldwork - and a specific cost is the bottleneck. We fund compute and API credits, events and meetups, research access, travel, community chapters, project tooling, and high-impact wildcard projects that do not fit a category yet.',
  },
  {
    title: 'Use judgment',
    accentClassName: 'bg-bluedot-darker/40',
    eyebrowClassName: 'text-bluedot-darker/70',
    body: 'General-purpose equipment, productivity subscriptions, or vague plans without evidence of work already underway. Stipends and living expenses are not our default, but we consider them for high-impact work - apply and make the argument.',
  },
];

const WhatThisIsForSection = () => {
  return (
    <Section className="rapid-grants-what-section" title="What this program is for">
      <div className="max-w-[760px] flex flex-col gap-5">
        <P>Over the past few months, we have given out nearly $50,000 in small grants to people in the BlueDot community. Now we are going bigger.</P>
        <P>Rapid Grants fund whatever it takes to remove the barrier between talented people, great ideas and their best work on AI safety. We fund everything from compute for projects, events you want to run, travel to hubs, community building, and more.</P>
        <P>
          If you are unsure whether to apply, the default is simple:{' '}
          <a
            href={RAPID_GRANT_APPLICATION_URL}
            className="font-medium text-bluedot-darker underline underline-offset-4"
          >
            apply
          </a>
          .
        </P>
      </div>

      <div className="pt-4 min-[680px]:pt-6 min-[960px]:pt-8 grid gap-4 min-[960px]:grid-cols-2">
        {DECISION_CARDS.map((card) => (
          <div
            key={card.title}
            className="relative overflow-hidden rounded-[24px] border border-bluedot-darker/10 bg-white px-6 py-6 lg:px-8"
          >
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <span className={`size-2 rounded-full ${card.accentClassName}`} />
                <p className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${card.eyebrowClassName}`}>
                  {card.title}
                </p>
              </div>
              <P className="max-w-[46ch] text-[15px] min-[680px]:text-[16px] leading-[1.8] text-bluedot-darker/70">
                {card.body}
              </P>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default WhatThisIsForSection;
