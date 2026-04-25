import { P } from '@bluedot/ui';
import {
  PiCompass,
  PiHandshake,
  PiUsersThree,
} from 'react-icons/pi';

// TODO: replace with pageSectionHeadingClass from ../PageListRow once #2309 lands
const SECTION_HEADING_CLASS = 'text-[24px] font-bold tracking-[-0.4px] leading-[1.333] text-bluedot-navy';

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
    <section className="section section-body career-transition-grant-what-section">
      <div className="w-full min-[680px]:max-w-[840px] flex flex-col gap-6">
        <h3 className={SECTION_HEADING_CLASS}>What this is for</h3>

        <div className="flex flex-col gap-5">
          <P>
            BlueDot&apos;s career transition grant supports you to work full-time on impactful AI safety work. It enables you to fully focus on upskilling, exploring opportunities, building your network, and figuring out where you can have the most impact.
          </P>
          <P>Alongside funding, you also get:</P>
        </div>

        <div className="pt-2 grid gap-8 grid-cols-1 md:grid-cols-3">
          {SUPPORT_CARDS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col gap-5">
              <div className="size-14 rounded-lg flex items-center justify-center flex-shrink-0 bg-bluedot-lighter/40">
                <Icon className="text-bluedot-navy" size={28} />
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-[18px] font-semibold leading-tight text-bluedot-navy">
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
