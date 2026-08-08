import { H3, H4, P } from '@bluedot/ui';
import {
  PiCompass,
  PiCurrencyDollar,
  PiHandshake,
  PiUsersThree,
} from 'react-icons/pi';

const SUPPORT_CARDS = [
  {
    icon: PiCurrencyDollar,
    title: 'Funding',
    description: 'A fellowship grant that allows you to focus full-time on the transition.',
  },
  {
    icon: PiCompass,
    title: 'Advising',
    description: 'Structured check-ins to review evidence, pressure-test decisions and adapt the plan when circumstances change.',
  },
  {
    icon: PiHandshake,
    title: 'Targeted connections',
    description: 'Where useful and where we can help, we may introduce you to people who can provide relevant feedback, expertise or opportunities.',
  },
  {
    icon: PiUsersThree,
    title: 'Community',
    description: 'Connection with other people making serious transitions into AI safety and biosecurity.',
  },
];

const WhatYouReceiveSection = () => {
  return (
    <section className="section section-body career-transition-grant-support-section">
      <div className="w-full flex flex-col gap-8">
        <H3>What you receive</H3>
        <div className="grid gap-8 grid-cols-1 bd-md:grid-cols-2 min-[1120px]:grid-cols-4">
          {SUPPORT_CARDS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col gap-5">
              <div className="size-14 rounded-lg flex items-center justify-center flex-shrink-0 bg-bluedot-lighter/40">
                <Icon className="text-bluedot-navy" size={28} />
              </div>
              <div className="flex flex-col gap-2">
                <H4>{title}</H4>
                <P className="text-bluedot-navy/80">{description}</P>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatYouReceiveSection;
