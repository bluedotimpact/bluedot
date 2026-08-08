import { H3, P } from '@bluedot/ui';
import { PiCaretDown } from 'react-icons/pi';

const PREPARATION_ITEMS = [
  {
    title: 'Recent evidence',
    body: 'Examples of relevant action, achievement or momentum that help us understand what you can do.',
  },
  {
    title: 'Accessible work samples',
    body: 'Links to your strongest relevant work, or an explanation of the analogous evidence we should consider.',
  },
  {
    title: 'Milestones',
    body: 'The outputs, tests and decision points you expect during the transition.',
  },
  {
    title: 'Theory of change',
    body: 'How the proposed work could ultimately contribute to reducing catastrophic risks from advanced AI or biological threats.',
  },
  {
    title: 'A simple budget',
    body: 'The amount and duration you are requesting, what it covers and what the funding would change.',
  },
];

const ApplicationPreviewSection = () => {
  return (
    <section className="section section-body career-transition-grant-application-preview-section bg-color-canvas">
      <div className="w-full flex flex-col gap-6">
        <H3>Application preview</H3>
        <P className="max-w-3xl">The application takes around 45 minutes. You can prepare the main evidence before you begin.</P>
        <details className="group overflow-hidden rounded-xl border border-bluedot-navy/10 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 font-semibold text-bluedot-navy [&::-webkit-details-marker]:hidden">
            What to prepare
            <PiCaretDown aria-hidden className="size-5 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <ul className="grid grid-cols-1 gap-5 border-t border-bluedot-navy/10 px-6 py-6 bd-md:grid-cols-2">
            {PREPARATION_ITEMS.map((item) => (
              <li key={item.title} className="flex flex-col gap-1">
                <strong className="text-size-sm text-bluedot-navy">{item.title}</strong>
                <P className="text-bluedot-navy/80">{item.body}</P>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
};

export default ApplicationPreviewSection;
