import { P } from '@bluedot/ui';
import {
  PiCurrencyDollar,
  PiHandshake,
  PiRocketLaunch,
} from 'react-icons/pi';
import { pageSectionHeadingClass } from '../PageListRow';

const BENEFITS: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  description: React.ReactNode;
}[] = [
  {
    icon: PiRocketLaunch,
    title: 'From problem to pitch in 5 days',
    description: 'You\'ll make more progress in a week than most make in months. Threat models on Monday, interventions through Wednesday, pitch ready by Friday.',
  },
  {
    icon: PiHandshake,
    title: 'Work alongside the best',
    description: 'You\'ll work from our office at LISA alongside Apollo Research and other leading AI safety organizations. We bring in founders, funders, and experts throughout the week.',
  },
  {
    icon: PiCurrencyDollar,
    title: 'Get backed to build',
    description: (
      <>
        Strong pitches receive initial grants of £50k+ to work on your project full-time. Our first batch backed{' '}
        <a href="https://exonalab.com/" target="_blank" rel="noreferrer" className="underline hover:no-underline">Exona</a>
        {' '}— they have since raised more, work from our co-working space, and are already hiring.
      </>
    ),
  },
];

const WhatYouGetSection = () => {
  return (
    <section className="section section-body incubator-week-benefits-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>What you&apos;ll get</h3>

        <div className="pt-2 grid gap-8 grid-cols-1 bd-md:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
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

export default WhatYouGetSection;
