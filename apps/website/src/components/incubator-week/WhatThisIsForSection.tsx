import { H3, H4, P } from '@bluedot/ui';
import {
  PiBriefcase,
  PiCompass,
  PiFlask,
} from 'react-icons/pi';

const AUDIENCES = [
  {
    icon: PiBriefcase,
    title: 'For technical founders',
    description: 'who\'ve identified a gap in AI safety infrastructure and want to fill it.',
  },
  {
    icon: PiFlask,
    title: 'For researchers',
    description: 'ready to leave the lab and ship something that changes behavior, not just beliefs.',
  },
  {
    icon: PiCompass,
    title: 'For operators',
    description: 'who\'ve seen how AI deployment actually works and know what\'s missing.',
  },
];

const WhatThisIsForSection = () => {
  return (
    <section className="section section-body incubator-week-what-section">
      <div className="w-full flex flex-col gap-6">
        <H3>What you&apos;ll do</H3>

        <div className="flex flex-col gap-5">
          <P>
            Incubator Week is a 5-day sprint for experts considering founding in AI safety.
          </P>
          <P>
            We&apos;ll launch you into the field, help you lock in on a problem, find a co-founder. If we back your pitch, we will fund your immediate needs on the spot and—if you make good progress—give you up to $100k in grant funding within two weeks. The week is held in San Francisco.
          </P>
        </div>

        <H3 className="pt-4">Track record</H3>

        <div className="flex flex-col gap-5">
          <P>
            Past cohorts: 9 startups founded, $1M+ raised, 9-figure aggregate expected this year.
          </P>
          <div className="flex flex-col gap-2">
            <P>Alumni include:</P>
            <ul className="list-disc pl-6 flex flex-col gap-1">
              <li>Exona Lab: Founders met during the week; Pre-seed raised, 7-figure round in progress</li>
              <li>Jacob Arbeid: Quit AISI to found; Funding secured; $2.4M ARR pending</li>
              <li>Shay Yahal: Enterprise AI safety; Already has paying customers and partnership with Redwood Research</li>
              <li>Lysander Mawby: Mechanistic interpretability; Just wrapped up the FR8 incubator ($100k at $5M val)</li>
            </ul>
          </div>
          <P className="text-bluedot-navy/80 pt-4">
            Run by BlueDot Impact. We&apos;ve raised over $35M to build the workforce and organizations needed to safely navigate AGI.
          </P>
        </div>

        <H3 className="pt-4">About you</H3>

        <div className="pt-2 grid gap-8 grid-cols-1 bd-md:grid-cols-3">
          {AUDIENCES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col gap-5">
              <div className="size-14 rounded-lg flex items-center justify-center flex-shrink-0 bg-bluedot-lighter/40">
                <Icon className="text-bluedot-navy" size={28} />
              </div>
              <div className="flex flex-col gap-2">
                <H4>
                  {title}
                </H4>
                <P className="text-bluedot-navy/80">
                  {description}
                </P>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatThisIsForSection;
