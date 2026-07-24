import { H3, H4, P } from '@bluedot/ui';
import {
  PiCurrencyDollar,
  PiHandshake,
  PiRocketLaunch,
} from 'react-icons/pi';

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
    description: 'You\'ll work in person in San Francisco. We bring in founders, funders, and experts throughout the week.',
  },
  {
    icon: PiCurrencyDollar,
    title: 'Get backed to build',
    description: (
      <>
        If we back your pitch, we&apos;ll fund your immediate needs on the spot and—if you make good progress—give you up to $100k in grant funding within two weeks. Our first batch backed{' '}
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
        <H3>What you&apos;ll get</H3>

        <div className="pt-2 grid gap-8 grid-cols-1 bd-md:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
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

export default WhatYouGetSection;
