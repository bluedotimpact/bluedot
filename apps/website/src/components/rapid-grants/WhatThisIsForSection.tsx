import {
  CardShell, H3, H4, P,
} from '@bluedot/ui';
import { useGrantApplicationUrl } from '../grants/useGrantApplicationUrl';

const DECISION_CARDS = [
  {
    title: 'What we fund',
    body: 'Time and resources to make progress on AI safety or biosecurity. A focused period of research or learning, testing a promising idea, events and community building, living costs, travel, compute and tools. Wildcards welcome. Pitch us.',
  },
  {
    title: 'What we look for',
    body: 'A worthwhile direction, evidence you can make progress, and a clear role for funding. Tell us what you want to do, what you have done or learned so far, and what the grant would make possible.',
  },
];

const WhatThisIsForSection = () => {
  const applicationUrl = useGrantApplicationUrl('rapid-grants');

  return (
    <section className="section section-body rapid-grants-what-section">
      <div className="w-full flex flex-col gap-6">
        <H3>Who this is for</H3>

        <div className="flex flex-col gap-5">
          <P>For people taking a promising next step in AI safety or biosecurity. Grants of up to $20k can support your time, exploration and work, as well as the resources you need.</P>
          {applicationUrl && (
            <P>
              If in doubt,{' '}
              <a
                href={applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-bluedot-navy underline underline-offset-4"
              >
                apply
              </a>
              .
            </P>
          )}
        </div>

        <div className="pt-2 grid gap-4 bd-md:grid-cols-2">
          {DECISION_CARDS.map((card) => (
            <CardShell
              key={card.title}
              className="flex flex-col gap-4"
            >
              <H4>
                {card.title}
              </H4>
              <P className="text-bluedot-navy/80">
                {card.body}
              </P>
            </CardShell>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatThisIsForSection;
