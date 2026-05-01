import { P } from '@bluedot/ui';
import {
  PiBriefcase,
  PiCompass,
  PiFlask,
} from 'react-icons/pi';
import { pageSectionHeadingClass } from '../PageListRow';

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
        <h3 className={pageSectionHeadingClass}>What you&apos;ll do</h3>

        <div className="flex flex-col gap-5">
          <P>
            Incubator Week is a 5-day sprint for experts considering founding in AI safety.
          </P>
          <P>
            We&apos;ll launch you into the field, help you lock in on a problem, find a co-founder. If we like your pitch we will give you $50k equity-free by the end of the week. The week is held at <a href="https://www.safeai.org.uk/" className="underline hover:no-underline">LISA</a> in London.
          </P>
        </div>

        <h3 className={`${pageSectionHeadingClass} pt-4`}>Track record</h3>

        <div className="flex flex-col gap-5">
          <P>
            Three cohorts in: 9 companies founded, $500k+ raised, 9-figure aggregate expected this year.
          </P>
          <div className="flex flex-col gap-2">
            <P>Alumni include:</P>
            <ul className="list-disc pl-6 flex flex-col gap-1">
              <li>Exona Lab: Founders met during the week; Pre-seed raised, 7-figure round in progress</li>
              <li>Jacob Arbeid: Quit AISI to found; Funding secured; $2.4M ARR pending</li>
              <li>Zac Saber: Dropped out of EF; now on long-horizon AI evals; met his co-founder Jacob Arbeid during Incubator Week</li>
              <li>Shay Yahal: Enterprise AI security; Already has paying customers and partnership with Redwood Research</li>
              <li>Lysander Mawby: Mechanistic interpretability; Just wrapped up the FR8 incubator ($100k at $5M val)</li>
            </ul>
          </div>
          <P className="text-size-sm leading-[1.6] text-bluedot-navy/80 pt-4">
            Run by BlueDot Impact. We&apos;ve raised over $35M to build the workforce and organizations needed to safely navigate AGI.
          </P>
        </div>

        <h3 className={`${pageSectionHeadingClass} pt-4`}>About you</h3>

        <div className="pt-2 grid gap-8 grid-cols-1 bd-md:grid-cols-3">
          {AUDIENCES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col gap-5">
              <div className="size-14 rounded-lg flex items-center justify-center flex-shrink-0 bg-bluedot-lighter/40">
                <Icon className="text-bluedot-navy" size={28} />
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-size-md font-semibold leading-tight text-bluedot-navy">
                  {title}
                </h4>
                <P className="text-size-sm leading-[1.6] text-bluedot-navy/80">
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
