import {
  A, H3, H4, P,
} from '@bluedot/ui';
import { grantTypePath } from '../../lib/grantTypes';
import {
  PiCurrencyDollar,
  PiHandshake,
  PiTrendUp,
} from 'react-icons/pi';

const SUPPORT_CARDS = [
  {
    icon: PiCurrencyDollar,
    title: 'Funding',
    description: <>$20k-$200k for 6-12 months. If you need less than $20k, apply for a <A href={grantTypePath('rapid')}>Rapid Grant</A> instead, since it’s much faster.</>,
  },
  {
    icon: PiTrendUp,
    title: 'Introductions to follow-on funders',
    description: <>When you’re ready to scale, we’ll introduce you to larger funders such as <A href="https://coefficientgiving.org/tailwind/">Coefficient Giving</A> and <A href="https://www.longview.org/">Longview Philanthropy</A>.</>,
  },
  {
    icon: PiHandshake,
    title: 'Connections',
    description: <>Introductions to people in our network who can help, including potential hires, advisers and early users.</>,
  },
];

const WhatYouReceiveSection = () => {
  return (
    <section className="section section-body seed-grant-support-section">
      <div className="w-full flex flex-col gap-8">
        <H3>What you receive</H3>
        <div className="grid gap-8 grid-cols-1 bd-md:grid-cols-3">
          {SUPPORT_CARDS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col gap-5">
              <div className="size-14 rounded-lg flex items-center justify-center flex-shrink-0 bg-bluedot-lighter/40">
                <Icon className="text-primary" size={28} />
              </div>
              <div className="flex flex-col gap-2">
                <H4>{title}</H4>
                <P className="text-secondary">{description}</P>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatYouReceiveSection;
