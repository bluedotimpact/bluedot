import { P, Section } from '@bluedot/ui';
import {
  PiCompass,
  PiHandshake,
  PiUsersThree,
} from 'react-icons/pi';

const SUPPORT_CARDS = [
  {
    icon: PiHandshake,
    title: 'Introductions',
    description: 'Warm intros to relevant people in the field so you can talk to the right people faster.',
  },
  {
    icon: PiCompass,
    title: 'Advising',
    description: 'Regular check-ins with your BlueDot point of contact to pressure-test your thinking and unblock you.',
  },
  {
    icon: PiUsersThree,
    title: 'Community',
    description: 'Connection to others making similar transitions so you are not figuring this out alone.',
  },
];

const WhatThisIsForSection = () => {
  return (
    <Section className="career-transition-grant-what-section" title="What this is for">
      <div className="flex flex-col gap-5 max-w-[760px]">
        <P>
          BlueDot&apos;s career transition grant supports you to work full-time on impactful AI safety work. It enables you to fully focus on upskilling, exploring opportunities, building your network, and figuring out where you can have the most impact.
        </P>
        <P>Alongside funding, you also get:</P>
      </div>

      <div className="pt-6 min-[680px]:pt-8 grid gap-8 grid-cols-1 md:grid-cols-3">
        {SUPPORT_CARDS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col gap-5">
            <div className="size-14 rounded-lg flex items-center justify-center flex-shrink-0 bg-bluedot-lighter/40">
              <Icon className="text-bluedot-darker" size={28} />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-[18px] font-semibold leading-tight text-bluedot-darker">
                {title}
              </h3>
              <P className="text-size-sm leading-[1.6] text-bluedot-darker/80">
                {description}
              </P>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default WhatThisIsForSection;
